import { parse as parseDate } from "date-fns";
import type { Content, Link, List, ListItem, Root } from "mdast";
import { visit } from "unist-util-visit";

import {
  NormalizedPromptSchema,
  type NormalizedPrompt,
  type NormalizedPromptInput,
  withContentHash
} from "@aiprompts/schema";

import type { ParseSkip, SourceAdapter, SourceAdapterResult } from "./types.js";
import { splitTitle } from "../parse/categorize.js";
import { extractTemplateArguments } from "../parse/extract-arguments.js";
import { extractImagesFromHtmlNodes } from "../parse/extract-images.js";
import { markdownToAst } from "../parse/markdown-to-ast.js";

type AdapterOptions = {
  sourceId: string;
  tool: string;
};

type PromptEntry = {
  headingText: string;
  nodes: Content[];
};

function normalizeLanguageCode(raw: string): string {
  const normalized = raw.trim().toLowerCase();
  const map: Record<string, string> = {
    en: "en",
    english: "en",
    zh: "zh",
    chinese: "zh",
    "简体中文": "zh",
    "繁體中文": "zh",
    中文: "zh",
    ja: "ja",
    japanese: "ja",
    日本語: "ja",
    ko: "ko",
    korean: "ko",
    한국어: "ko"
  };

  return map[normalized] ?? raw.trim();
}

function getNodeText(node: Content): string {
  let text = "";
  visit(node, "text", (child) => {
    text += child.value;
  });
  return text.trim();
}

function getHeadingText(node: Content): string {
  if (node.type !== "heading") {
    return "";
  }
  return getNodeText(node);
}

function sectionRange(root: Root, headingNeedle: string): [number, number] | null {
  const nodes = root.children;
  let start = -1;
  let end = nodes.length;

  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (!node) {
      continue;
    }
    if (node.type === "heading" && node.depth === 2 && getHeadingText(node).includes(headingNeedle)) {
      start = i + 1;
      break;
    }
  }

  if (start === -1) {
    return null;
  }

  for (let i = start; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (!node) {
      continue;
    }
    if (node.type === "heading" && node.depth === 2) {
      end = i;
      break;
    }
  }

  return [start, end];
}

function isValidHttpUrl(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function collectPromptEntries(nodes: Content[]): PromptEntry[] {
  const entries: PromptEntry[] = [];
  let current: PromptEntry | null = null;

  const noRankedHeadings = nodes.filter(
    (node) => node.type === "heading" && node.depth === 3 && /^No\.\s*\d+:/.test(getHeadingText(node))
  ).length;

  for (const node of nodes) {
    const headingText = node.type === "heading" ? getHeadingText(node) : "";
    const shouldStart =
      node.type === "heading" &&
      node.depth === 3 &&
      (noRankedHeadings > 0
        ? /^No\.\s*\d+:/.test(headingText)
        : !/more prompts not shown here/i.test(headingText));

    if (shouldStart) {
      if (current) {
        entries.push(current);
      }
      current = {
        headingText,
        nodes: []
      };
      continue;
    }

    if (current) {
      current.nodes.push(node);
    }
  }

  if (current) {
    entries.push(current);
  }

  return entries;
}

function parsePublishedDate(raw: string): string {
  const formats = ["MMMM d, yyyy", "MMM d, yyyy"];
  for (const format of formats) {
    const parsed = parseDate(raw, format, new Date());
    if (!Number.isNaN(parsed.getTime())) {
      return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())).toISOString();
    }
  }

  throw new Error(`Invalid Published date: ${raw}`);
}

function nextSectionContent(nodes: Content[], marker: string): Content[] {
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (!node) {
      continue;
    }
    if (node.type === "heading" && node.depth === 4 && getHeadingText(node).includes(marker)) {
      const collected: Content[] = [];
      for (let j = i + 1; j < nodes.length; j += 1) {
        const sibling = nodes[j];
        if (!sibling) {
          continue;
        }
        if (sibling.type === "heading" && sibling.depth <= 4) {
          break;
        }
        collected.push(sibling);
      }
      return collected;
    }
  }
  return [];
}

function nextSectionContentAny(nodes: Content[], markers: readonly string[]): Content[] {
  for (const marker of markers) {
    const section = nextSectionContent(nodes, marker);
    if (section.length > 0) {
      return section;
    }
  }
  return [];
}

function parseTaxonomy(root: Root): string[] {
  const range = sectionRange(root, "Browse by Category");
  if (!range) {
    return [];
  }

  const [start, end] = range;
  const labels: string[] = [];
  const nodes = root.children.slice(start, end);

  for (const node of nodes) {
    if (node.type !== "list") {
      continue;
    }
    for (const item of node.children) {
      const text = getNodeText(item as unknown as Content);
      if (text) {
        labels.push(text);
      }
    }
  }

  return [...new Set(labels)];
}

function parseDetails(listNode: List | undefined): {
  authorName: string;
  authorUrl?: string;
  sourceLabel: string;
  sourceUrl: string;
  publishedAt: string;
  language: string;
} {
  const details: Record<string, string> = {};
  const links: Record<string, string> = {};

  if (listNode) {
    for (const item of listNode.children as ListItem[]) {
      const paragraph = item.children.find((child: Content) => child.type === "paragraph");
      if (!paragraph) {
        continue;
      }

      const text = getNodeText(paragraph as unknown as Content);
      const colonIndex = text.indexOf(":");
      if (colonIndex === -1) {
        continue;
      }

      const label = text.slice(0, colonIndex).replaceAll("*", "").trim();
      const value = text.slice(colonIndex + 1).trim();
      details[label] = value;

      visit(paragraph as unknown as Content, "link", (linkNode: Link) => {
        if (linkNode.url) {
          links[label] = linkNode.url;
        }
      });
    }
  }

  const publishedRaw = details.Published;
  if (!publishedRaw) {
    // Fallback for compact inline details format used by some sources.
    for (const node of listNode?.children ?? []) {
      void node;
    }
  }

  if (publishedRaw) {
    const sourceUrl = isValidHttpUrl(links.Source) ? links.Source : undefined;
    const authorUrl = isValidHttpUrl(links.Author) ? links.Author : undefined;

    return {
      authorName: details.Author ?? "Unknown",
      ...(authorUrl ? { authorUrl } : {}),
      sourceLabel: details.Source ?? "Source",
      sourceUrl: sourceUrl ?? "https://youmind.com",
      publishedAt: parsePublishedDate(publishedRaw),
      language: normalizeLanguageCode(details.Languages ?? "en")
    };
  }

  throw new Error("Missing inline Details fields");
}

function parseInlineDetailsFromNodes(nodes: Content[]): {
  authorName: string;
  authorUrl?: string;
  sourceLabel: string;
  sourceUrl: string;
  publishedAt: string;
  language: string;
} {
  const detailsParagraph = nodes.find(
    (node) =>
      node.type === "paragraph" &&
      /Author:/i.test(getNodeText(node)) &&
      /Published:/i.test(getNodeText(node))
  );

  if (!detailsParagraph) {
    throw new Error("Missing inline Details fields");
  }

  const text = getNodeText(detailsParagraph);
  const publishedRaw = text.match(/Published:\s*([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4})/i)?.[1];
  if (!publishedRaw) {
    throw new Error("Missing Published field");
  }

  const links: Array<{ text: string; url: string }> = [];
  visit(detailsParagraph, "link", (linkNode: Link) => {
    links.push({ text: getNodeText(linkNode as unknown as Content), url: linkNode.url });
  });

  const author = links[0];
  const source = links[1];
  if (!author || !source) {
    throw new Error("Missing Author/Source links");
  }

  return {
    authorName: author.text || "Unknown",
    ...(isValidHttpUrl(author.url) ? { authorUrl: author.url } : {}),
    sourceLabel: source.text || "Source",
    sourceUrl: isValidHttpUrl(source.url) ? source.url : "https://youmind.com",
    publishedAt: parsePublishedDate(publishedRaw),
    language: "en"
  };
}

function parseBadges(nodes: Content[]): { language?: string; featured: boolean; raycastFriendly: boolean } {
  let language: string | undefined;
  let featured = false;
  let raycastFriendly = false;

  for (const node of nodes) {
    visit(node, "image", (imageNode) => {
      const alt = imageNode.alt ?? "";
      const langMatch = alt.match(/^Language-([A-Za-z-]+)$/i);
      if (langMatch?.[1]) {
        language = normalizeLanguageCode(langMatch[1]);
      } else if (/^lang-/i.test(alt)) {
        language = normalizeLanguageCode(alt.replace(/^lang-/i, ""));
      } else if (/^[A-Za-z]{2,5}$/.test(alt)) {
        language = normalizeLanguageCode(alt);
      } else if (/badge\/lang-/i.test(imageNode.url)) {
        const badgeLang = imageNode.url.match(/badge\/lang-([^-/]+)/i)?.[1];
        if (badgeLang) {
          language = normalizeLanguageCode(decodeURIComponent(badgeLang));
        }
      }
      if (/featured/i.test(alt)) {
        featured = true;
      }
      if (/raycast/i.test(alt)) {
        raycastFriendly = true;
      }

      if (!language) {
        const normalizedAlt = normalizeLanguageCode(alt);
        if (normalizedAlt !== alt) {
          language = normalizedAlt;
        }
      }
    });
  }

  return {
    ...(language ? { language } : {}),
    featured,
    raycastFriendly
  };
}

function tryGetExternalUrl(nodes: Content[]): string {
  for (const node of nodes) {
    let found: string | null = null;
    visit(node, "link", (linkNode: Link) => {
      if (found) {
        return;
      }
      if (/youmind\.com\//i.test(linkNode.url)) {
        found = linkNode.url;
      }
    });
    if (found) {
      return found;
    }
  }

  throw new Error("Missing external Try-it URL");
}

function getExternalId(url: string, headingText: string): string {
  const parsed = new URL(url);
  const explicitId = parsed.searchParams.get("id");
  if (explicitId) {
    return explicitId;
  }

  const promptParam = parsed.searchParams.get("prompt");
  if (promptParam) {
    const noMatch = headingText.match(/^No\.\s*(\d+)\s*:/i)?.[1];
    return noMatch ? `no-${noMatch}` : `prompt-${promptParam.length}`;
  }

  const noMatch = headingText.match(/^No\.\s*(\d+)\s*:/i)?.[1];
  if (noMatch) {
    return `no-${noMatch}`;
  }

  throw new Error("Missing external id");
}

function headingToRawTitle(headingText: string): string {
  const match = headingText.match(/^No\.\s*\d+:\s*(.+)$/);
  if (!match?.[1]) {
    return headingText.trim();
  }
  return match[1].trim();
}

function parseEntry(
  entry: PromptEntry,
  options: AdapterOptions,
  taxonomy: readonly string[]
): NormalizedPromptInput {
  const rawTitle = headingToRawTitle(entry.headingText);
  const titleParts = splitTitle(rawTitle, taxonomy);

  const descriptionNodes = nextSectionContent(entry.nodes, "📖 Description");
  const descriptionFromHeading = descriptionNodes.map((node) => getNodeText(node)).join("\n").trim();
  const descriptionFromQuote = entry.nodes
    .filter((node) => node.type === "blockquote")
    .map((node) => getNodeText(node))
    .join("\n")
    .trim();
  const description = descriptionFromHeading || descriptionFromQuote || "";

  const promptNodes = nextSectionContent(entry.nodes, "📝 Prompt");
  const promptCode = promptNodes.find((node) => node.type === "code");
  if (!promptCode || promptCode.type !== "code") {
    throw new Error("Missing prompt code block");
  }

  const imageNodes = (() => {
    const fromImages = nextSectionContentAny(entry.nodes, [
      "🖼️ Generated Images",
      "🖼️ Example Images",
      "🖼️ Images"
    ]);
    if (fromImages.length > 0) {
      return fromImages;
    }
    return nextSectionContent(entry.nodes, "🎬 Video");
  })();
  const imageHtmlNodes = imageNodes
    .filter((node) => node.type === "html")
    .map((node) => (node.type === "html" ? node.value : ""));
  const images = extractImagesFromHtmlNodes(imageHtmlNodes);
  if (images.length === 0) {
    const fallbackHtmlNodes = entry.nodes
      .filter((node) => node.type === "html")
      .map((node) => (node.type === "html" ? node.value : ""));
    images.push(...extractImagesFromHtmlNodes(fallbackHtmlNodes));
  }
  if (images.length === 0) {
    const markdownImages: NormalizedPromptInput["images"] = [];
    for (const node of imageNodes.length > 0 ? imageNodes : entry.nodes) {
      visit(node, "image", (imageNode) => {
        if (/img\.shields\.io/i.test(imageNode.url)) {
          return;
        }
        markdownImages.push({
          url: imageNode.url,
          alt: imageNode.alt ?? ""
        });
      });
    }
    images.push(...markdownImages);
  }
  if (images.length === 0) {
    throw new Error("No images found");
  }

  const detailsNodes = nextSectionContent(entry.nodes, "📌 Details");
  const detailsList = detailsNodes.find((node) => node.type === "list") as List | undefined;
  const details = detailsList ? parseDetails(detailsList) : parseInlineDetailsFromNodes(entry.nodes);

  const externalUrl = tryGetExternalUrl(entry.nodes);
  const externalId = getExternalId(externalUrl, entry.headingText);
  const templateArguments = extractTemplateArguments(promptCode.value);
  const badges = parseBadges(entry.nodes);

  // Clean image alt texts: strip category prefix and "- Image N" suffix
  const cleanTitle = titleParts.title;
  const cleanedImages = images.map((img) => {
    let alt = img.alt ?? "";
    // Remove "Category - " prefix if present
    if (titleParts.category && alt.startsWith(`${titleParts.category} - `)) {
      alt = alt.slice(titleParts.category.length + 3);
    }
    // Remove " - Image N" suffix
    alt = alt.replace(/\s*-\s*Image\s*\d+\s*$/i, "").trim();
    // Fallback to clean title
    if (!alt) alt = cleanTitle;
    return { ...img, alt };
  });

  return {
    id: `${options.sourceId}:${externalId}`,
    sourceId: options.sourceId,
    tool: options.tool,
    externalId,
    title: cleanTitle,
    category: titleParts.category,
    description,
    promptText: promptCode.value,
    promptFormat: (() => {
      try {
        JSON.parse(promptCode.value);
        return "json" as const;
      } catch {
        return "text" as const;
      }
    })(),
    templateArguments,
    raycastFriendly: badges.raycastFriendly || templateArguments.length > 0,
    featured: badges.featured,
    language: badges.language ?? details.language,
    images: cleanedImages,
    author: {
      name: details.authorName,
      url: details.authorUrl
    },
    source: {
      label: details.sourceLabel,
      url: details.sourceUrl
    },
    publishedAt: details.publishedAt,
    externalUrl
  };
}

export class YouMindAwesomeListAdapter implements SourceAdapter {
  private readonly sourceId: string;
  private readonly tool: string;

  public constructor(options: AdapterOptions) {
    this.sourceId = options.sourceId;
    this.tool = options.tool;
  }

  public parse(readmeMarkdown: string): SourceAdapterResult {
    const ast = markdownToAst(readmeMarkdown);
    const taxonomy = parseTaxonomy(ast);
    const skipped: ParseSkip[] = [];

    const allRange = sectionRange(ast, "All Prompts");
    if (!allRange) {
      throw new Error("All Prompts section missing");
    }
    const [allStart, allEnd] = allRange;
    const allEntries = collectPromptEntries(ast.children.slice(allStart, allEnd));

    const featuredRange = sectionRange(ast, "Featured Prompts");
    const featuredEntries = featuredRange
      ? collectPromptEntries(ast.children.slice(featuredRange[0], featuredRange[1]))
      : [];

    const parsedAll: NormalizedPrompt[] = [];
    for (const entry of allEntries) {
      try {
        const base = parseEntry(entry, { sourceId: this.sourceId, tool: this.tool }, taxonomy);
        const prompt = NormalizedPromptSchema.parse(withContentHash(base));
        parsedAll.push(prompt);
      } catch (error) {
        skipped.push({
          title: entry.headingText,
          reason: error instanceof Error ? error.message : "Unknown parse error"
        });
      }
    }

    const categoryById = new Map(parsedAll.map((item) => [item.externalId, item.category]));
    const featuredIds = new Set<string>();

    for (const entry of featuredEntries) {
      try {
        const parsed = parseEntry(entry, { sourceId: this.sourceId, tool: this.tool }, taxonomy);
        featuredIds.add(parsed.externalId);
      } catch (error) {
        skipped.push({
          title: entry.headingText,
          reason: error instanceof Error ? error.message : "Unknown featured parse error"
        });
      }
    }

    const prompts = parsedAll.map((item) => {
      const category = item.category ?? categoryById.get(item.externalId) ?? null;
      return NormalizedPromptSchema.parse(
        withContentHash({
          ...item,
          category,
          featured: item.featured || featuredIds.has(item.externalId)
        })
      );
    });

    return {
      prompts,
      taxonomy,
      skipped
    };
  }
}

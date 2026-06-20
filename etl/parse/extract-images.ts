import { parse as parseHtml } from "node-html-parser";

import type { PromptImage } from "@aiprompts/schema";

export function extractImagesFromHtmlNodes(htmlNodes: readonly string[]): PromptImage[] {
  const images: PromptImage[] = [];

  for (const html of htmlNodes) {
    const root = parseHtml(html);
    const imgNodes = root.querySelectorAll("img");

    for (const img of imgNodes) {
      const src = img.getAttribute("src");
      if (!src) {
        continue;
      }

      const widthRaw = img.getAttribute("width");
      const heightRaw = img.getAttribute("height");
      const width = widthRaw ? Number.parseInt(widthRaw, 10) : undefined;
      const height = heightRaw ? Number.parseInt(heightRaw, 10) : undefined;

      images.push({
        url: src,
        alt: img.getAttribute("alt") ?? "",
        width: Number.isFinite(width) ? width : undefined,
        height: Number.isFinite(height) ? height : undefined
      });
    }
  }

  return images;
}

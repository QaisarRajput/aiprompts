import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import type { Root } from "mdast";

const parser = unified().use(remarkParse).use(remarkGfm);

export function markdownToAst(markdown: string): Root {
  return parser.parse(markdown) as Root;
}

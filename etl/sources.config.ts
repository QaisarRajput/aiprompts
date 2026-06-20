import { YouMindAwesomeListAdapter } from "./adapters/youmind-awesome-list.js";
import type { SourceAdapter } from "./adapters/types.js";

export type SourceConfig = {
  id: string;
  tool: string;
  owner: string;
  repo: string;
  branch: string;
  readmePath: string;
  adapter: SourceAdapter;
};

export const sources: SourceConfig[] = [
  {
    id: "gpt-image-2",
    tool: "GPT Image 2",
    owner: "YouMind-OpenLab",
    repo: "awesome-gpt-image-2",
    branch: "main",
    readmePath: "README.md",
    adapter: new YouMindAwesomeListAdapter({
      sourceId: "gpt-image-2",
      tool: "GPT Image 2"
    })
  },
  {
    id: "seedance-2",
    tool: "Seedance 2",
    owner: "YouMind-OpenLab",
    repo: "awesome-seedance-2-prompts",
    branch: "main",
    readmePath: "README.md",
    adapter: new YouMindAwesomeListAdapter({
      sourceId: "seedance-2",
      tool: "Seedance 2"
    })
  },
  {
    id: "nano-banana-pro",
    tool: "Nano Banana Pro",
    owner: "YouMind-OpenLab",
    repo: "awesome-nano-banana-pro-prompts",
    branch: "main",
    readmePath: "README.md",
    adapter: new YouMindAwesomeListAdapter({
      sourceId: "nano-banana-pro",
      tool: "Nano Banana Pro"
    })
  },
  {
    id: "grok-imagine",
    tool: "Grok Imagine",
    owner: "YouMind-OpenLab",
    repo: "awesome-grok-imagine-prompts",
    branch: "main",
    readmePath: "README.md",
    adapter: new YouMindAwesomeListAdapter({
      sourceId: "grok-imagine",
      tool: "Grok Imagine"
    })
  },
  {
    id: "gemini-3",
    tool: "Gemini 3",
    owner: "YouMind-OpenLab",
    repo: "awesome-gemini-3-prompts",
    branch: "main",
    readmePath: "README.md",
    adapter: new YouMindAwesomeListAdapter({
      sourceId: "gemini-3",
      tool: "Gemini 3"
    })
  },
  {
    id: "seedream-4-5",
    tool: "Seedream 4.5",
    owner: "YouMind-OpenLab",
    repo: "awesome-seedream-4.5",
    branch: "main",
    readmePath: "README.md",
    adapter: new YouMindAwesomeListAdapter({
      sourceId: "seedream-4-5",
      tool: "Seedream 4.5"
    })
  },
  {
    id: "gpt-image-1-5",
    tool: "GPT Image 1.5",
    owner: "YouMind-OpenLab",
    repo: "awesome-gpt-image-1.5",
    branch: "main",
    readmePath: "README.md",
    adapter: new YouMindAwesomeListAdapter({
      sourceId: "gpt-image-1-5",
      tool: "GPT Image 1.5"
    })
  }
];

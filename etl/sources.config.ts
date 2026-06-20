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
  }
];

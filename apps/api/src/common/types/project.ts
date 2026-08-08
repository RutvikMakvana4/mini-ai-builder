export type ModelProvider = "claude" | "gpt" | "gemini";
export type GenerationStatus = "IDLE" | "GENERATING" | "COMPLETED" | "FAILED";

export interface ProjectFile {
  path: string;
  content: string;
}

export interface Project {
  id: string;
  name: string;
  prompt: string;
  model: ModelProvider;
  createdAt: string;
  generationStatus: GenerationStatus;
  files: ProjectFile[];
}
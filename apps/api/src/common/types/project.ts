import { BuildStatus } from "./build";
import { DeploymentStatus } from "./deployment";

export type ModelProvider = "claude" | "gpt" | "gemini";
export type GenerationStatus = "IDLE" | "GENERATING" | "COMPLETED" | "FAILED";

export interface ProjectFile {
  path: string;
  content: string;
}

export type SandboxStatus =
  | "NONE"
  | "CREATING"
  | "INSTALLING"
  | "READY"
  | "STOPPED"
  | "FAILED";

export interface Project {
  id: string;
  name: string;
  prompt: string;
  model: ModelProvider;
  createdAt: string;
  generationStatus: GenerationStatus;
  files: ProjectFile[];
  sandboxId?: string;
  sandboxStatus: SandboxStatus;
  previewUrl?: string;
  buildStatus: BuildStatus;
  buildError?: string;
  repairAttempts: number;
  deploymentStatus: DeploymentStatus;
  deployUrl?: string;
  deployError?: string;
}

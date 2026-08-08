export type ModelProvider = "claude" | "gpt" | "gemini";

export type GenerationStatus = "IDLE" | "GENERATING" | "COMPLETED" | "FAILED";
export type BuildStatus =
  | "QUEUED"
  | "INSTALLING"
  | "BUILDING"
  | "READY"
  | "FAILED";
export type SandboxStatus =
  | "CREATING"
  | "READY"
  | "RUNNING"
  | "STOPPED"
  | "FAILED";
export type DeploymentStatus =
  | "IDLE"
  | "QUEUED"
  | "BUILDING"
  | "DEPLOYING"
  | "READY"
  | "FAILED";

export interface ProjectFile {
  path: string;
  content: string;
}

export interface LogEvent {
  id: string;
  type: string;
  timestamp: string;
  message: string;
}

export interface Project {
  id: string;
  name: string;
  prompt: string;
  model: ModelProvider;
  createdAt: string;
  generationStatus: GenerationStatus;
  buildStatus: BuildStatus;
  sandboxStatus: SandboxStatus;
  deploymentStatus: DeploymentStatus;
  previewUrl?: string;
  deployUrl?: string;
}

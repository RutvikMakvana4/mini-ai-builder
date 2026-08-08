export type BuildStatus =
  | "NOT_STARTED"
  | "INSTALLING"
  | "BUILDING"
  | "STARTING"
  | "READY"
  | "BUILD_FAILED";

export interface BuildStepResult {
  command: string;
  exitCode: number;
  log: string;
  durationMs: number;
}

export interface BuildRecord {
  status: BuildStatus;
  steps: BuildStepResult[];
  error?: string;
  repairAttempts: number;
}
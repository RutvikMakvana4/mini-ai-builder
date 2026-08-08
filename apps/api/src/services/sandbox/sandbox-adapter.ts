export interface SandboxHandle {
  id: string;
  previewUrl: string;
}

export interface SandboxStepResult {
  command: string;
  exitCode: number;
  log: string;
  durationMs: number;
}

export interface SandboxAdapter {
  create(projectId: string): Promise<SandboxHandle>;
  writeFiles(
    sandboxId: string,
    files: { path: string; content: string }[],
  ): Promise<void>;
  installDependencies(sandboxId: string): Promise<SandboxStepResult>;
  runBuild(sandboxId: string): Promise<SandboxStepResult>;
  startApplication(
    sandboxId: string,
    port: number,
  ): Promise<{ previewUrl: string }>;
  getLogs(sandboxId: string): string[];
  stop(sandboxId: string): Promise<void>;
  destroy(sandboxId: string): Promise<void>;
}

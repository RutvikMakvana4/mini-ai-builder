export interface SandboxHandle {
  id: string;
  previewUrl: string;
}

export interface SandboxAdapter {
  create(projectId: string): Promise<SandboxHandle>;
  writeFiles(
    sandboxId: string,
    files: { path: string; content: string }[],
  ): Promise<void>;
  installDependencies(
    sandboxId: string,
  ): Promise<{ success: boolean; log: string }>;
  runBuild(sandboxId: string): Promise<{ success: boolean; log: string }>;
  startApplication(
    sandboxId: string,
    port: number,
  ): Promise<{ previewUrl: string }>;
  getLogs(sandboxId: string): string[];
  stop(sandboxId: string): Promise<void>;
  destroy(sandboxId: string): Promise<void>;
}

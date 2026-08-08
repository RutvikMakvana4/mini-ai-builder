import { SandboxAdapter, SandboxStepResult } from "./sandbox-adapter";
import { VercelSandboxAdapter } from "./vercel-sandbox-adapter";
import { ProjectFile } from "../../common/types/project";

export class SandboxService {
  constructor(private adapter: SandboxAdapter) {}

  create(projectId: string) {
    return this.adapter.create(projectId);
  }

  writeFiles(sandboxId: string, files: ProjectFile[]) {
    return this.adapter.writeFiles(sandboxId, files);
  }

  installDependencies(sandboxId: string): Promise<SandboxStepResult> {
    return this.adapter.installDependencies(sandboxId);
  }

  runBuild(sandboxId: string): Promise<SandboxStepResult> {
    return this.adapter.runBuild(sandboxId);
  }

  startApplication(sandboxId: string, port: number) {
    return this.adapter.startApplication(sandboxId, port);
  }

  getLogs(sandboxId: string) {
    return this.adapter.getLogs(sandboxId);
  }

  stop(sandboxId: string) {
    return this.adapter.stop(sandboxId);
  }

  destroy(sandboxId: string) {
    return this.adapter.destroy(sandboxId);
  }
}

export const sandboxService = new SandboxService(new VercelSandboxAdapter());

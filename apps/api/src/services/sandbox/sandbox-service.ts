import { SandboxAdapter } from "./sandbox-adapter";
import { VercelSandboxAdapter } from "./vercel-sandbox-adapter";
import { ProjectFile } from "../../common/types/project";

const PREVIEW_PORT = 3000;

export class SandboxService {
  constructor(private adapter: SandboxAdapter) {}

  async provisionAndRun(projectId: string, files: ProjectFile[]) {
    const handle = await this.adapter.create(projectId);
    await this.adapter.writeFiles(handle.id, files);

    const install = await this.adapter.installDependencies(handle.id);
    if (!install.success) {
      return {
        status: "FAILED" as const,
        sandboxId: handle.id,
        log: install.log,
      };
    }

    const build = await this.adapter.runBuild(handle.id);
    if (!build.success) {
      return {
        status: "FAILED" as const,
        sandboxId: handle.id,
        log: build.log,
      };
    }

    const { previewUrl } = await this.adapter.startApplication(
      handle.id,
      PREVIEW_PORT,
    );
    return { status: "READY" as const, sandboxId: handle.id, previewUrl };
  }

  getLogs(sandboxId: string) {
    return this.adapter.getLogs(sandboxId);
  }

  async stop(sandboxId: string) {
    return this.adapter.stop(sandboxId);
  }

  async destroy(sandboxId: string) {
    return this.adapter.destroy(sandboxId);
  }
}

export const sandboxService = new SandboxService(new VercelSandboxAdapter());

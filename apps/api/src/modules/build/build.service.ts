import { sandboxService } from "../../services/sandbox/sandbox-service";
import { aiService } from "../../services/ai";
import { applyPatch } from "./apply-patch";
import { projectsStore } from "../projects/projects.store";
import { Project, ProjectFile } from "../../common/types/project";
import { BuildRecord, BuildStepResult } from "../../common/types/build";

const MAX_REPAIR_ATTEMPTS = 2;
const PREVIEW_PORT = 3000;

export async function runBuildPipeline(project: Project): Promise<BuildRecord> {
  const steps: BuildStepResult[] = [];
  let files: ProjectFile[] = project.files;

  let sandboxId = project.sandboxId;
  if (!sandboxId) {
    const handle = await sandboxService.create(project.id);
    sandboxId = handle.id;
    projectsStore.update(project.id, { sandboxId, previewUrl: handle.previewUrl });
  }

  for (let attempt = 0; attempt <= MAX_REPAIR_ATTEMPTS; attempt++) {
    projectsStore.update(project.id, { buildStatus: "INSTALLING", files });
    await sandboxService.writeFiles(sandboxId, files);

    const install = await sandboxService.installDependencies(sandboxId);
    steps.push(install);

    let errorLog: string | undefined;

    if (install.exitCode !== 0) {
      errorLog = install.log;
    } else {
      projectsStore.update(project.id, { buildStatus: "BUILDING" });
      const build = await sandboxService.runBuild(sandboxId);
      steps.push(build);
      if (build.exitCode !== 0) errorLog = build.log;
    }

    if (!errorLog) {
      projectsStore.update(project.id, { buildStatus: "STARTING" });
      const { previewUrl } = await sandboxService.startApplication(sandboxId, PREVIEW_PORT);
      projectsStore.update(project.id, {
        buildStatus: "READY",
        previewUrl,
        files,
        repairAttempts: attempt,
        buildError: undefined,
      });
      return { status: "READY", steps, repairAttempts: attempt };
    }

    // Build failed — out of attempts?
    if (attempt === MAX_REPAIR_ATTEMPTS) {
      projectsStore.update(project.id, {
        buildStatus: "BUILD_FAILED",
        buildError: errorLog,
        repairAttempts: attempt,
      });
      return { status: "BUILD_FAILED", steps, error: errorLog, repairAttempts: attempt };
    }

    // Attempt AI repair, then loop to rebuild
    const patch = await aiService.repairApplication(files, errorLog, project.model);
    files = applyPatch(files, patch);
    projectsStore.update(project.id, { files, repairAttempts: attempt + 1 });
  }

  // Unreachable, satisfies TS
  throw new Error("Build pipeline exited unexpectedly");
}
import { sandboxService } from "../../services/sandbox/sandbox-service";
import { aiService } from "../../services/ai";
import { applyPatch } from "./apply-patch";
import { projectsStore } from "../projects/projects.store";
import { eventBus } from "../events/event-bus";
import { Project, ProjectFile } from "../../common/types/project";
import { BuildRecord, BuildStepResult } from "../../common/types/build";

const MAX_REPAIR_ATTEMPTS = 2;
const PREVIEW_PORT = 3000;

export async function runBuildPipeline(project: Project): Promise<BuildRecord> {
  const steps: BuildStepResult[] = [];
  let files: ProjectFile[] = project.files;

  // Ensure a sandbox exists for this project
  let sandboxId = project.sandboxId;
  if (!sandboxId) {
    const handle = await sandboxService.create(project.id);
    sandboxId = handle.id;
    projectsStore.update(project.id, {
      sandboxId,
      previewUrl: handle.previewUrl,
    });
    eventBus.emitProjectEvent(project.id, "sandbox.created", { sandboxId });
  }

  for (let attempt = 0; attempt <= MAX_REPAIR_ATTEMPTS; attempt++) {
    eventBus.emitProjectEvent(project.id, "build.started", { attempt });

    projectsStore.update(project.id, { buildStatus: "INSTALLING", files });
    await sandboxService.writeFiles(sandboxId, files);

    const install = await sandboxService.installDependencies(sandboxId);
    steps.push(install);
    eventBus.emitProjectEvent(project.id, "build.log", {
      command: install.command,
      log: install.log,
    });

    let errorLog: string | undefined;

    if (install.exitCode !== 0) {
      errorLog = install.log;
    } else {
      projectsStore.update(project.id, { buildStatus: "BUILDING" });
      const build = await sandboxService.runBuild(sandboxId);
      steps.push(build);
      eventBus.emitProjectEvent(project.id, "build.log", {
        command: build.command,
        log: build.log,
      });
      if (build.exitCode !== 0) errorLog = build.log;
    }

    // Build (and install) succeeded — start the app and finish
    if (!errorLog) {
      projectsStore.update(project.id, { buildStatus: "STARTING" });
      const { previewUrl } = await sandboxService.startApplication(
        sandboxId,
        PREVIEW_PORT,
      );

      projectsStore.update(project.id, {
        buildStatus: "READY",
        previewUrl,
        files,
        repairAttempts: attempt,
        buildError: undefined,
      });

      const readyProject = projectsStore.findById(project.id);
      eventBus.emitProjectEvent(project.id, "build.completed", {
        attempt,
        project: readyProject,
      });
      eventBus.emitProjectEvent(project.id, "preview.ready", {
        previewUrl,
        project: readyProject,
      });

      return { status: "READY", steps, repairAttempts: attempt };
    }

    // Build failed — out of repair attempts, give up
    if (attempt === MAX_REPAIR_ATTEMPTS) {
      projectsStore.update(project.id, {
        buildStatus: "BUILD_FAILED",
        buildError: errorLog,
        repairAttempts: attempt,
      });

      const failedProject = projectsStore.findById(project.id);
      eventBus.emitProjectEvent(project.id, "build.failed", {
        error: errorLog,
        attempt,
        project: failedProject,
      });

      return {
        status: "BUILD_FAILED",
        steps,
        error: errorLog,
        repairAttempts: attempt,
      };
    }

    // Attempt an AI repair, then loop to rebuild with the patched files
    eventBus.emitProjectEvent(project.id, "repair.started", {
      attempt: attempt + 1,
      error: errorLog,
    });

    const patch = await aiService.repairApplication(
      files,
      errorLog,
      project.model,
    );
    files = applyPatch(files, patch);

    projectsStore.update(project.id, { files, repairAttempts: attempt + 1 });

    eventBus.emitProjectEvent(project.id, "repair.completed", {
      attempt: attempt + 1,
      changedFiles: patch.changes.map((c) => c.path),
    });
  }

  // Unreachable — loop always returns within MAX_REPAIR_ATTEMPTS + 1 iterations
  throw new Error("Build pipeline exited unexpectedly");
}

import { Sandbox } from "@vercel/sandbox";
import {
  SandboxAdapter,
  SandboxHandle,
  SandboxStepResult,
} from "./sandbox-adapter";
import { AppError } from "../../common/errors/app-error";

const PREVIEW_PORT = 3000;

// sandboxId (our concept) === sandbox.name in @vercel/sandbox
const logBuffers = new Map<string, string[]>();
const sandboxes = new Map<string, Sandbox>();

function appendLog(sandboxId: string, chunk: string) {
  const logs = logBuffers.get(sandboxId) ?? [];
  logs.push(chunk);
  logBuffers.set(sandboxId, logs);
}

export class VercelSandboxAdapter implements SandboxAdapter {
  async create(projectId: string): Promise<SandboxHandle> {
    try {
      const name = `mini-ai-builder-${projectId}-${Date.now()}`;
      const sandbox = await Sandbox.create({
        name,
        runtime: "node24",
        ports: [PREVIEW_PORT],
        timeout: 45 * 60 * 1000, // 45 min — the max allowed on Hobby plans
        teamId: process.env.VERCEL_TEAM_ID,
        projectId: process.env.VERCEL_PROJECT_ID,
        token: process.env.VERCEL_TOKEN,
      });
      sandboxes.set(name, sandbox);
      logBuffers.set(name, []);
      return { id: name, previewUrl: sandbox.domain(PREVIEW_PORT) };
    } catch (err) {
      throw new AppError(
        "SANDBOX_CREATE_FAILED",
        "Failed to create sandbox",
        502,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  private getSandbox(sandboxId: string): Sandbox {
    const sandbox = sandboxes.get(sandboxId);
    if (!sandbox) {
      throw new AppError(
        "SANDBOX_NOT_FOUND",
        "Sandbox not found or expired",
        404,
      );
    }
    return sandbox;
  }

  async writeFiles(
    sandboxId: string,
    files: { path: string; content: string }[],
  ): Promise<void> {
    const sandbox = this.getSandbox(sandboxId);
    await sandbox.writeFiles(
      files.map((f) => ({
        path: f.path,
        content: Buffer.from(f.content, "utf-8"),
      })),
    );
  }

  async installDependencies(sandboxId: string): Promise<SandboxStepResult> {
    const start = Date.now();
    const sandbox = this.getSandbox(sandboxId);
    const result = await sandbox.runCommand({ cmd: "npm", args: ["install"] });
    const stdout = await result.stdout();
    const stderr = await result.stderr();
    appendLog(sandboxId, stdout);
    appendLog(sandboxId, stderr);
    return {
      command: "npm install",
      exitCode: result.exitCode,
      log: stdout + stderr,
      durationMs: Date.now() - start,
    };
  }

  async runBuild(sandboxId: string): Promise<SandboxStepResult> {
    const start = Date.now();
    const sandbox = this.getSandbox(sandboxId);
    const result = await sandbox.runCommand({
      cmd: "npm",
      args: ["run", "build"],
    });
    const stdout = await result.stdout();
    const stderr = await result.stderr();
    appendLog(sandboxId, stdout);
    appendLog(sandboxId, stderr);
    return {
      command: "npm run build",
      exitCode: result.exitCode,
      log: stdout + stderr,
      durationMs: Date.now() - start,
    };
  }

  async startApplication(sandboxId: string, port: number) {
    const sandbox = this.getSandbox(sandboxId);
    await sandbox.runCommand({
      cmd: "npm",
      args: ["run", "start", "--", "-p", String(port)],
      detached: true,
    });

    const previewUrl = sandbox.domain(port);
    await this.waitUntilListening(sandboxId, previewUrl);

    appendLog(sandboxId, `Started application on port ${port}`);
    return { previewUrl };
  }

  private async waitUntilListening(
    sandboxId: string,
    url: string,
    timeoutMs = 30_000,
    intervalMs = 1500,
  ): Promise<void> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      try {
        const res = await fetch(url, { method: "GET" });
        if (res.status < 500) {
          return; // reachable — even a 404 means the server is up and responding
        }
      } catch {
        // not listening yet, keep polling
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }

    appendLog(
      sandboxId,
      `App did not start listening on port within ${timeoutMs / 1000}s`,
    );
    throw new AppError(
      "SANDBOX_NOT_LISTENING",
      "App did not start listening on the requested port in time",
      502,
    );
  }

  getLogs(sandboxId: string): string[] {
    return logBuffers.get(sandboxId) ?? [];
  }

  async stop(sandboxId: string): Promise<void> {
    const sandbox = this.getSandbox(sandboxId);
    await sandbox.stop();
  }

  async destroy(sandboxId: string): Promise<void> {
    const sandbox = this.getSandbox(sandboxId);
    await sandbox.stop();
    sandboxes.delete(sandboxId);
    logBuffers.delete(sandboxId);
  }
}

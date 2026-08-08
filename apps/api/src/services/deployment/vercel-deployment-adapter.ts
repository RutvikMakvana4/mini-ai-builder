import { DeploymentAdapter } from "./deployment-adapter";
import { ProjectFile } from "../../common/types/project";
import {
  DeploymentResult,
  DeploymentStatus,
} from "../../common/types/deployment";
import { AppError } from "../../common/errors/app-error";

const VERCEL_API = "https://api.vercel.com";

function readyStateToStatus(readyState: string): DeploymentStatus {
  switch (readyState) {
    case "QUEUED":
      return "QUEUED";
    case "INITIALIZING":
    case "BUILDING":
      return "BUILDING";
    case "READY":
      return "READY";
    case "ERROR":
    case "CANCELED":
      return "FAILED";
    default:
      return "DEPLOYING";
  }
}

export class VercelDeploymentAdapter implements DeploymentAdapter {
  private token = process.env.VERCEL_TOKEN;
  private teamId = process.env.VERCEL_TEAM_ID;

  private headers() {
    if (!this.token) {
      throw new AppError(
        "DEPLOYMENT_NOT_CONFIGURED",
        "VERCEL_TOKEN is not set",
        500,
      );
    }
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  async deploy(
    projectName: string,
    files: ProjectFile[],
  ): Promise<DeploymentResult> {
    const query = this.teamId ? `?teamId=${this.teamId}` : "";

    const body = {
      name: projectName,
      target: "production",
      projectSettings: {
        framework: "nextjs",
        buildCommand: "npm run build",
        installCommand: "npm install",
      },
      files: files.map((f) => ({
        file: f.path,
        data: Buffer.from(f.content, "utf-8").toString("base64"),
        encoding: "base64",
      })),
    };

    const res = await fetch(`${VERCEL_API}/v13/deployments${query}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new AppError(
        "DEPLOYMENT_FAILED",
        "Failed to create Vercel deployment",
        502,
        errBody?.error?.message ?? res.statusText,
      );
    }

    const data = (await res.json()) as { id?: string; url?: string; readyState?: string };
    return {
      deploymentId: data.id ?? "",
      url: data.url ? `https://${data.url}` : "",
      status: readyStateToStatus(data.readyState ?? "QUEUED"),
    };
  }

  async getStatus(deploymentId: string): Promise<DeploymentResult> {
    const query = this.teamId ? `?teamId=${this.teamId}` : "";
    const res = await fetch(
      `${VERCEL_API}/v13/deployments/${deploymentId}${query}`,
      {
        headers: this.headers(),
      },
    );

    if (!res.ok) {
      throw new AppError(
        "DEPLOYMENT_STATUS_FAILED",
        "Failed to fetch deployment status",
        502,
      );
    }

    const data = (await res.json()) as { id?: string; url?: string; readyState?: string };
    return {
      deploymentId: data.id ?? "",
      url: data.url ? `https://${data.url}` : "",
      status: readyStateToStatus(data.readyState ?? "QUEUED"),
    };
  }
}

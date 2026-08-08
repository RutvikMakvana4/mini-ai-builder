import { DeploymentAdapter } from "./deployment-adapter";
import { VercelDeploymentAdapter } from "./vercel-deployment-adapter";
import { ProjectFile } from "../../common/types/project";
import { DeploymentResult } from "../../common/types/deployment";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 60; // ~3 minutes

export class DeploymentService {
  constructor(private adapter: DeploymentAdapter) {}

  async deployAndWait(
    projectName: string,
    files: ProjectFile[],
    onProgress: (result: DeploymentResult) => void
  ): Promise<DeploymentResult> {
    let result = await this.adapter.deploy(projectName, files);
    onProgress(result);

    let polls = 0;
    while (result.status !== "READY" && result.status !== "FAILED" && polls < MAX_POLLS) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      result = await this.adapter.getStatus(result.deploymentId);
      onProgress(result);
      polls++;
    }

    return result;
  }
}

export const deploymentService = new DeploymentService(new VercelDeploymentAdapter());
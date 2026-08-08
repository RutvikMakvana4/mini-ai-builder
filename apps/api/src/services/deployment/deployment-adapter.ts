import { ProjectFile } from "../../common/types/project";
import { DeploymentResult } from "../../common/types/deployment";

export interface DeploymentAdapter {
  deploy(projectName: string, files: ProjectFile[]): Promise<DeploymentResult>;
  getStatus(deploymentId: string): Promise<DeploymentResult>;
}

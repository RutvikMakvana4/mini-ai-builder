export type DeploymentStatus =
  | "IDLE"
  | "QUEUED"
  | "BUILDING"
  | "DEPLOYING"
  | "READY"
  | "FAILED";

export interface DeploymentResult {
  deploymentId: string;
  url: string;
  status: DeploymentStatus;
}

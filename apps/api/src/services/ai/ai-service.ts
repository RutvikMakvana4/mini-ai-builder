import { GeneratedProject } from "../../common/validation/generation";
import { ModelProvider } from "../../common/types/project";

export interface AIService {
  generateApplication(
    prompt: string,
    model: ModelProvider,
  ): Promise<GeneratedProject>;
  repairApplication(
    files: { path: string; content: string }[],
    buildError: string,
    model: ModelProvider,
  ): Promise<GeneratedProject>;
}

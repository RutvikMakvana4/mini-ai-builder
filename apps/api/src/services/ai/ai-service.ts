import { GeneratedProject } from "../../common/validation/generation";
import { Patch } from "../../common/validation/repair";
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
  ): Promise<Patch>;
}

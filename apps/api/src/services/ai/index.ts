import { AnthropicAIService } from "./anthropic-ai-service";
import { AIService } from "./ai-service";

// Swap implementation here later without touching controllers/modules.
export const aiService: AIService = new AnthropicAIService();

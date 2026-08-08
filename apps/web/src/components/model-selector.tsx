"use client";

import { ModelProvider } from "@/types/project";
import { cn } from "@/lib/utils";

const MODELS: { id: ModelProvider; label: string }[] = [
  { id: "claude", label: "Claude" },
  { id: "gpt", label: "GPT" },
  { id: "gemini", label: "Gemini" },
];

export function ModelSelector({
  value,
  onChange,
}: {
  value: ModelProvider;
  onChange: (model: ModelProvider) => void;
}) {
  return (
    <div className="flex gap-2">
      {MODELS.map((model) => (
        <button
          key={model.id}
          type="button"
          onClick={() => onChange(model.id)}
          className={cn(
            "px-4 py-2 rounded-md border text-sm font-medium transition-colors",
            value === model.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-input hover:bg-accent"
          )}
        >
          {model.label}
        </button>
      ))}
    </div>
  );
}
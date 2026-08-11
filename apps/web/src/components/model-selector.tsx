"use client";

import { ModelProvider } from "@/types/project";
import { cn } from "@/lib/utils";

const MODELS: { id: ModelProvider; label: string }[] = [
  { id: "claude", label: "claude" },
  { id: "gpt", label: "gpt" },
  { id: "gemini", label: "gemini" },
];

export function ModelSelector({
  value,
  onChange,
}: {
  value: ModelProvider;
  onChange: (model: ModelProvider) => void;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-border p-0.5">
      {MODELS.map((model) => (
        <button
          key={model.id}
          type="button"
          onClick={() => onChange(model.id)}
          className={cn(
            "rounded-full px-3 py-1 font-mono text-xs transition-colors",
            value === model.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {model.label}
        </button>
      ))}
    </div>
  );
}

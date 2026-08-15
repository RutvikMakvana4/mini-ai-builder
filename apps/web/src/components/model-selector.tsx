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
    <div className="flex gap-1.5">
      {MODELS.map((model) => (
        <button
          key={model.id}
          type="button"
          onClick={() => onChange(model.id)}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-medium transition-colors",
            value === model.id
              ? "bg-zinc-200 text-black"
              : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          {model.label}
        </button>
      ))}
    </div>
  );
}

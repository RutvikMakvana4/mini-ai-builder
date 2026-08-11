"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { ModelSelector } from "@/components/model-selector";
import { ModelProvider } from "@/types/project";
import { createProject, generateProject } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const MAX_PROMPT_LENGTH = 500;

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<ModelProvider>("claude");
  const [isGenerating, setIsGenerating] = useState(false);

  const canGenerate = name.trim().length > 0 && prompt.trim().length > 0;

  async function handleGenerate() {
    if (!canGenerate) return;
    setIsGenerating(true);
    try {
      const project = await createProject({ name, prompt, model });
      await generateProject(project.id);
      router.push(`/projects/${project.id}`);
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />

      <main className="relative flex-1 flex items-center justify-center px-6 py-20 overflow-hidden">
        <div className="ambient-glow" aria-hidden="true" />

        <div className="relative w-full max-w-2xl">
          <div className="flex justify-center mb-8">
            <span className="inline-flex items-center rounded-full border border-border px-3 py-1 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              application builder
            </span>
          </div>

          <h1 className="text-center text-4xl sm:text-6xl font-bold tracking-tight leading-[1.08] text-balance">
            From prompt to production-ready app.
          </h1>

          <p className="mt-5 text-center text-muted-foreground text-balance">
            Powered by Claude, GPT, or Gemini — automatically built, installed,
            tested, and repaired in a live sandbox before delivery.
          </p>

          <div className="mt-10 rounded-2xl border border-border bg-card overflow-hidden">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="project name — gym landing page"
              maxLength={80}
              className="w-full bg-transparent border-b border-border px-5 py-3 text-sm font-mono placeholder:text-muted-foreground/60 outline-none"
            />

            <textarea
              value={prompt}
              onChange={(e) =>
                e.target.value.length <= MAX_PROMPT_LENGTH &&
                setPrompt(e.target.value)
              }
              rows={5}
              placeholder="an app that tracks my gym workouts and shows weekly progress..."
              className="w-full resize-none bg-transparent px-5 py-4 text-sm font-mono placeholder:text-muted-foreground/60 outline-none"
            />

            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border">
              <ModelSelector value={model} onChange={setModel} />
              <span className="font-mono text-xs text-muted-foreground shrink-0">
                {prompt.length}/{MAX_PROMPT_LENGTH}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={!canGenerate || isGenerating}
            onClick={handleGenerate}
            className={cn(
              "mt-4 w-full rounded-xl py-3.5 text-sm font-semibold tracking-tight transition-all",
              "bg-primary text-primary-foreground hover:bg-primary/85",
              "disabled:opacity-40 disabled:pointer-events-none",
            )}
          >
            {isGenerating ? "generating..." : "generate app"}
          </button>
        </div>
      </main>
    </div>
  );
}

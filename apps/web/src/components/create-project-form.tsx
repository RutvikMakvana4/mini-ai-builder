"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ModelSelector } from "@/components/model-selector";
import { ModelProvider } from "@/types/project";
import { createProject, generateProject } from "@/lib/api-client";

const MAX_PROMPT_LENGTH = 500;

export function CreateProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<ModelProvider>("claude");
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerate() {
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
    <div className="max-w-3xl mx-auto">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="project name — gym landing page"
          className="w-full bg-transparent px-6 py-5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none border-b border-zinc-800"
        />
        <textarea
          value={prompt}
          onChange={(e) =>
            setPrompt(e.target.value.slice(0, MAX_PROMPT_LENGTH))
          }
          placeholder="an app that tracks my gym workouts and shows weekly progress..."
          rows={6}
          className="w-full bg-transparent px-6 py-5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none resize-none"
        />
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
          <ModelSelector value={model} onChange={setModel} />
          <span className="text-xs text-zinc-600">
            {prompt.length}/{MAX_PROMPT_LENGTH}
          </span>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!name || !prompt || isGenerating}
        className="w-full mt-4 py-4 rounded-2xl bg-zinc-300 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-black font-semibold text-sm transition-colors"
      >
        {isGenerating ? "generating..." : "generate app"}
      </button>
    </div>
  );
}

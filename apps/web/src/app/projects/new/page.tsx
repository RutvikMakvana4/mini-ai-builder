"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ModelSelector } from "@/components/model-selector";
import { ModelProvider } from "@/types/project";
import { createProject, generateProject } from "@/lib/api-client";

export default function NewProjectPage() {
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
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Create Application</h1>

      <div className="space-y-5">
        <div>
          <Label htmlFor="name">Project Name</Label>
          <Input
            id="name"
            placeholder="Gym Landing Page"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea
            id="prompt"
            rows={5}
            placeholder="Create a modern landing page for a gym application."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div>
          <Label>Model</Label>
          <div className="mt-2">
            <ModelSelector value={model} onChange={setModel} />
          </div>
        </div>

        <Button
          className="w-full"
          disabled={!name || !prompt || isGenerating}
          onClick={handleGenerate}
        >
          {isGenerating ? "Generating..." : "Generate Application"}
        </Button>
      </div>
    </main>
  );
}

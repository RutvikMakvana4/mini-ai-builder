"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { listProjects } from "@/lib/api-client";
import { Project } from "@/types/project";

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" {
  if (status === "READY") return "default";
  if (status === "BUILD_FAILED") return "destructive";
  return "secondary";
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6 border border-dashed border-zinc-800 rounded-2xl">
      <h2 className="text-lg font-semibold mb-2">No projects yet</h2>
      <p className="text-sm text-zinc-500 max-w-sm mb-6">
        Describe the app you want and we&apos;ll generate, build, and preview it
        for you.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-full bg-zinc-200 text-black text-sm font-semibold hover:bg-white transition-colors"
      >
        Create your first project
      </Link>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Your Projects</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {projects && projects.length > 0
            ? `${projects.length} project${projects.length === 1 ? "" : "s"}`
            : "Build something new"}
        </p>
      </div>

      {projects === null && <p className="text-sm text-zinc-500">Loading...</p>}
      {projects?.length === 0 && <EmptyState />}

      {projects && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="p-5 rounded-xl border border-zinc-800 hover:border-zinc-600 transition-colors h-full">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold truncate">{project.name}</h2>
                  <div className="flex gap-1 shrink-0">
                    <Badge variant={statusVariant(project.buildStatus)}>
                      {project.buildStatus}
                    </Badge>
                    {project.deploymentStatus === "READY" && (
                      <Badge>Deployed</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-zinc-500 mt-2 line-clamp-2">
                  {project.prompt}
                </p>
                <div className="text-xs text-zinc-600 mt-4 uppercase">
                  {project.model}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

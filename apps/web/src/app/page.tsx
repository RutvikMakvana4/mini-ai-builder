"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listProjects } from "@/lib/api-client";
import { Project } from "@/types/project";

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" {
  if (status === "READY") return "default";
  if (status === "BUILD_FAILED") return "destructive";
  return "secondary";
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);

  return (
    <main className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Your Projects</h1>
        <Link href="/projects/new">
          <Button>New Project</Button>
        </Link>
      </div>

      {projects === null && (
        <p className="text-sm text-muted-foreground">Loading projects...</p>
      )}

      {projects?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No projects yet — create your first one.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects?.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className="p-5 hover:border-primary transition-colors cursor-pointer">
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
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {project.prompt}
              </p>
              <div className="text-xs text-muted-foreground mt-4 uppercase">
                {project.model}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}

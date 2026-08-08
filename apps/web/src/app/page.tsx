import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockProjects } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <main className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Your Projects</h1>
        <Link href="/projects/new">
          <Button>New Project</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockProjects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className="p-5 hover:border-primary transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{project.name}</h2>
                <Badge
                  variant={
                    project.buildStatus === "READY" ? "default" : "secondary"
                  }
                >
                  {project.buildStatus}
                </Badge>
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

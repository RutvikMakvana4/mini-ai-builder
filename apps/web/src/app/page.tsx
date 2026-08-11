import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { mockProjects } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { BuildStatus } from "@/types/project";

function statusStyles(status: BuildStatus) {
  if (status === "READY")
    return "bg-success/15 text-success border-success/30";
  if (status === "FAILED")
    return "bg-destructive/15 text-destructive border-destructive/30";
  return "bg-warning/15 text-warning border-warning/30";
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />

      <main className="max-w-5xl w-full mx-auto px-6 py-12 flex-1">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              workspace
            </span>
            <h1 className="text-2xl font-bold tracking-tight mt-1">
              your projects
            </h1>
          </div>
          <Link
            href="/projects/new"
            className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/85 transition-colors"
          >
            new project
          </Link>
        </div>

        {mockProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-24 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">
              nothing built yet
            </p>
            <Link
              href="/projects/new"
              className="font-mono text-xs text-foreground underline underline-offset-4"
            >
              describe your first app
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockProjects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="group h-full rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/25">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold tracking-tight">
                      {project.name}
                    </h2>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
                        statusStyles(project.buildStatus),
                      )}
                    >
                      {project.buildStatus}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {project.prompt}
                  </p>
                  <div className="flex items-center justify-between mt-5">
                    <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wide">
                      {project.model}
                    </span>
                    {project.deployUrl && (
                      <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[160px]">
                        {project.deployUrl.replace("https://", "")}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

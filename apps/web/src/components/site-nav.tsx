import Link from "next/link";

const REPO_URL = "https://github.com/RutvikMakvana4/mini-ai-builder";

export function SiteNav() {
  return (
    <header className="border-b border-border/60">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-sm tracking-tight text-foreground"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-[4px] border border-border/80 text-[10px] text-muted-foreground">
            {"{}"}
          </span>
          mini-ai-builder
        </Link>

        <nav className="flex items-center gap-6 font-mono text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            projects
          </Link>
          <Link
            href="/projects/new"
            className="transition-colors hover:text-foreground"
          >
            new
          </Link>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
            aria-label="View source on GitHub"
          >
            github
          </a>
        </nav>
      </div>
    </header>
  );
}

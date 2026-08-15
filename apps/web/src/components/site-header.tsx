import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-800 bg-black">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between font-mono">
        <Link href="/" className="flex items-center gap-2 text-white">
          <span className="w-7 h-7 rounded border border-zinc-700 flex items-center justify-center text-xs text-zinc-400">
            {"{}"}
          </span>
          <span className="font-semibold tracking-tight">mini-ai-builder</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm text-zinc-400">
          <Link href="/projects" className="hover:text-white transition-colors">
            projects
          </Link>
          <Link href="/" className="hover:text-white transition-colors">
            new
          </Link>

          <a
            href="https://github.com/RutvikMakvana4/mini-ai-builder"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            github
          </a>
        </nav>
      </div>
    </header>
  );
}

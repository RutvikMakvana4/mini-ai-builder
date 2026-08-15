import { CreateProjectForm } from "@/components/create-project-form";

export default function HomePage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-24">
      <div className="text-center mb-14">
        <span className="inline-block px-3 py-1 rounded-full border border-zinc-800 text-[11px] tracking-widest text-zinc-500 uppercase mb-8">
          Application Builder
        </span>
        <h1 className="text-5xl md:text-6xl font-serif font-bold leading-[1.1] mb-6">
          From prompt to
          <br />
          production-ready app.
        </h1>
        <p className="text-zinc-400 text-sm max-w-xl mx-auto leading-relaxed">
          Powered by Claude, GPT, or Gemini — automatically built, installed,
          tested, and repaired in a live sandbox before delivery.
        </p>
      </div>

      <CreateProjectForm />
    </main>
  );
}

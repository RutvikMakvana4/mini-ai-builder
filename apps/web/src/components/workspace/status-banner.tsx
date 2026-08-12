"use client";

interface StatusBannerProps {
  generationStatus: string;
  buildStatus: string;
}

const PHASES: Record<string, { label: string; tone: "active" | "error" | "done" }> = {
  GENERATING: { label: "Generating your app...", tone: "active" },
  INSTALLING: { label: "Installing dependencies...", tone: "active" },
  BUILDING: { label: "Building your app...", tone: "active" },
  STARTING: { label: "Starting preview server...", tone: "active" },
  BUILD_FAILED: { label: "Build failed — check logs below", tone: "error" },
};

function Spinner() {
  return (
    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function StatusBanner({ generationStatus, buildStatus }: StatusBannerProps) {
  const phase =
    generationStatus === "GENERATING"
      ? PHASES.GENERATING
      : PHASES[buildStatus];

  if (!phase) return null;

  const toneClasses =
    phase.tone === "error"
      ? "bg-red-50 text-red-700 border-red-200"
      : phase.tone === "done"
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-blue-50 text-blue-700 border-blue-200";

  return (
    <div className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b ${toneClasses}`}>
      {phase.tone === "active" && <Spinner />}
      {phase.label}
    </div>
  );
}
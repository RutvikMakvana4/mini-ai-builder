import { LogEvent, Project, ProjectFile } from "@/types/project";

export const mockProjects: Project[] = [
  {
    id: "proj-1",
    name: "Gym Landing Page",
    prompt: "Create a modern landing page for a gym application.",
    model: "claude",
    createdAt: new Date().toISOString(),
    generationStatus: "COMPLETED",
    buildStatus: "READY",
    sandboxStatus: "RUNNING",
    deploymentStatus: "READY",
    previewUrl: "https://sandbox.example.dev/proj-1",
    deployUrl: "https://gym-landing.vercel.app",
  },
  {
    id: "proj-2",
    name: "SaaS Pricing Page",
    prompt: "Create a pricing page with three tiers for a SaaS product.",
    model: "gpt",
    createdAt: new Date().toISOString(),
    generationStatus: "IDLE",
    buildStatus: "QUEUED",
    sandboxStatus: "STOPPED",
    deploymentStatus: "IDLE",
  },
];

export const mockFiles: ProjectFile[] = [
  {
    path: "app/page.tsx",
    language: "typescriptreact",
    content: `export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white">
      <h1 className="text-4xl font-bold p-10">Welcome to the Gym</h1>
    </main>
  );
}
`,
  },
  {
    path: "app/layout.tsx",
    language: "typescriptreact",
    content: `import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
  },
  {
    path: "components/Hero.tsx",
    language: "typescriptreact",
    content: `export function Hero() {
  return (
    <section className="py-24 text-center">
      <h2 className="text-5xl font-extrabold">Train Harder. Live Stronger.</h2>
      <p className="mt-4 text-lg text-gray-400">Join today and get your first week free.</p>
    </section>
  );
}
`,
  },
  {
    path: "package.json",
    language: "json",
    content: `{
  "name": "gym-landing-page",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "18.3.0",
    "react-dom": "18.3.0"
  }
}
`,
  },
];

export const mockLogs: LogEvent[] = [
  {
    id: "1",
    type: "generation.started",
    timestamp: new Date().toISOString(),
    message: "Generation started...",
  },
  {
    id: "2",
    type: "generation.completed",
    timestamp: new Date().toISOString(),
    message: "Generated 4 files.",
  },
  {
    id: "3",
    type: "sandbox.created",
    timestamp: new Date().toISOString(),
    message: "Sandbox created.",
  },
  {
    id: "4",
    type: "build.started",
    timestamp: new Date().toISOString(),
    message: "$ npm install",
  },
  {
    id: "5",
    type: "build.log",
    timestamp: new Date().toISOString(),
    message: "$ npm run build",
  },
  {
    id: "6",
    type: "build.completed",
    timestamp: new Date().toISOString(),
    message: "✓ Compiled successfully",
  },
  {
    id: "7",
    type: "preview.ready",
    timestamp: new Date().toISOString(),
    message: "Preview ready.",
  },
];

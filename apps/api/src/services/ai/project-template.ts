import { ProjectFile } from "../../common/types/project";

export function getStaticFiles(projectName: string): ProjectFile[] {
  const slug =
    projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .slice(0, 50) || "app";

  return [
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: slug,
          version: "0.1.0",
          private: true,
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
          },
          dependencies: {
            next: "^14.2.5",
            react: "^18.3.1",
            "react-dom": "^18.3.1",
          },
          devDependencies: {
            typescript: "^5.4.5",
            tailwindcss: "^3.4.4",
            postcss: "^8.4.38",
            autoprefixer: "^10.4.19",
            "@types/node": "^20.14.0",
            "@types/react": "^18.3.3",
          },
        },
        null,
        2,
      ),
    },
    {
      path: "tsconfig.json",
      content: JSON.stringify(
        {
          compilerOptions: {
            target: "ES2017",
            lib: ["dom", "dom.iterable", "esnext"],
            allowJs: true,
            skipLibCheck: true,
            strict: false,
            noEmit: true,
            esModuleInterop: true,
            module: "esnext",
            moduleResolution: "bundler",
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: "preserve",
            incremental: true,
            plugins: [{ name: "next" }],
            paths: { "@/*": ["./*"] },
          },
          include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
          exclude: ["node_modules"],
        },
        null,
        2,
      ),
    },
    {
      path: "next.config.js",
      content: `/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;
`,
    },
    {
      path: "postcss.config.js",
      content: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,
    },
    {
      path: "tailwind.config.js",
      content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
`,
    },
    {
      path: "app/globals.css",
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
    },
    {
      path: "app/layout.tsx",
      content: `import "./globals.css";

export const metadata = {
  title: "${projectName}",
};

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
      path: "next-env.d.ts",
      content: `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`,
    },
  ];
}

export const PROTECTED_PATHS = new Set([
  "package.json",
  "tsconfig.json",
  "next.config.js",
  "postcss.config.js",
  "tailwind.config.js",
  "app/globals.css",
  "app/layout.tsx",
  "next-env.d.ts",
]);

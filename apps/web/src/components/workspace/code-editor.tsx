"use client";

import Editor from "@monaco-editor/react";
import { ProjectFile } from "@/types/project";

const LANGUAGE_MAP: Record<ProjectFile["language"], string> = {
  typescript: "typescript",
  typescriptreact: "typescript",
  json: "json",
  css: "css",
};

export function CodeEditor({ file }: { file: ProjectFile | undefined }) {
  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Select a file to view its contents
      </div>
    );
  }

  return (
    <Editor
      height="100%"
      theme="vs-dark"
      path={file.path}
      language={LANGUAGE_MAP[file.language]}
      value={file.content}
      options={{ minimap: { enabled: false }, fontSize: 13 }}
    />
  );
}
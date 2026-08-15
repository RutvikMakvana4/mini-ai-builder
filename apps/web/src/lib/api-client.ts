const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function createProject(input: {
  name: string;
  prompt: string;
  model: string;
}) {
  const res = await fetch(`${API_URL}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok)
    throw new Error(
      (await res.json()).error?.message ?? "Failed to create project",
    );
  return (await res.json()).project;
}

export async function generateProject(id: string) {
  const res = await fetch(`${API_URL}/api/projects/${id}/generate`, {
    method: "POST",
  });
  if (!res.ok)
    throw new Error((await res.json()).error?.message ?? "Generation failed");
  return (await res.json()).project;
}

export async function getProject(id: string) {
  const res = await fetch(`${API_URL}/api/projects/${id}`);
  if (!res.ok) throw new Error("Project not found");
  return (await res.json()).project;
}

export async function updateFile(id: string, path: string, content: string) {
  const res = await fetch(`${API_URL}/api/projects/${id}/files/${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok)
    throw new Error((await res.json()).error?.message ?? "Failed to save file");
  return (await res.json()).file;
}

export async function deployProject(id: string) {
  const res = await fetch(`${API_URL}/api/projects/${id}/deploy`, {
    method: "POST",
  });
  if (!res.ok)
    throw new Error((await res.json()).error?.message ?? "Deploy failed");
  return (await res.json()).project;
}

export async function restartBuild(id: string) {
  const res = await fetch(`${API_URL}/api/projects/${id}/build/restart`, {
    method: "POST",
  });
  if (!res.ok)
    throw new Error((await res.json()).error?.message ?? "Restart failed");
  return (await res.json()).project;
}

export async function listProjects() {
  const res = await fetch(`${API_URL}/api/projects`);
  if (!res.ok) throw new Error("Failed to load projects");
  return (await res.json()).projects;
}

import { Project } from "../../common/types/project";

const projects = new Map<string, Project>();

export const projectsStore = {
  create(project: Project) {
    projects.set(project.id, project);
    return project;
  },
  findAll() {
    return Array.from(projects.values());
  },
  findById(id: string) {
    return projects.get(id);
  },
  update(id: string, patch: Partial<Project>) {
    const existing = projects.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    projects.set(id, updated);
    return updated;
  },
};

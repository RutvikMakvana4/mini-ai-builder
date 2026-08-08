import { EventEmitter } from "events";

export interface ProjectEvent {
  type: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

class EventBus extends EventEmitter {
  emitProjectEvent(
    projectId: string,
    type: string,
    data?: Record<string, unknown>,
  ) {
    const event: ProjectEvent = {
      type,
      timestamp: new Date().toISOString(),
      data,
    };
    this.emit(`project:${projectId}`, event);
  }

  subscribe(projectId: string, listener: (event: ProjectEvent) => void) {
    this.on(`project:${projectId}`, listener);
    return () => this.off(`project:${projectId}`, listener);
  }
}

// Raise default max listeners since many SSE clients may subscribe over time
export const eventBus = new EventBus();
eventBus.setMaxListeners(50);

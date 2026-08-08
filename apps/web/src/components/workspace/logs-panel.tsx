"use client";

import { LogEvent } from "@/types/project";
import { ScrollArea } from "@/components/ui/scroll-area";

export function LogsPanel({ logs }: { logs: LogEvent[] }) {
  return (
    <ScrollArea className="h-full bg-black text-green-400 font-mono text-xs">
      <div className="p-3 space-y-1">
        {logs.map((log) => (
          <div key={log.id}>
            <span className="text-gray-500">[{log.type}]</span> {log.message}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

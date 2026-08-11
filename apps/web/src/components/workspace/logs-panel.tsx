"use client";

import { LogEvent } from "@/types/project";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function logColor(type: string) {
  if (type.includes("failed") || type.includes("error"))
    return "text-destructive";
  if (type.includes("completed") || type.includes("ready"))
    return "text-success";
  if (type.includes("started") || type.includes("log"))
    return "text-muted-foreground";
  return "text-foreground";
}

export function LogsPanel({ logs }: { logs: LogEvent[] }) {
  return (
    <ScrollArea className="h-full bg-black font-mono text-xs">
      <div className="p-3 space-y-1">
        {logs.length === 0 && (
          <div className="text-muted-foreground">waiting for events...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className={cn(logColor(log.type))}>
            <span className="text-neutral-600">[{log.type}]</span>{" "}
            {log.message}
          </div>
        ))}
        <div className="text-success terminal-cursor">$</div>
      </div>
    </ScrollArea>
  );
}

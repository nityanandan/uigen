"use client";

import { Loader2 } from "lucide-react";

interface ToolCallBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  state: "call" | "partial-call" | "result";
  result?: unknown;
}

function getToolLabel(toolName: string, args: Record<string, unknown>): string {
  const command = args.command as string | undefined;
  const path = args.path as string | undefined;

  if (toolName === "str_replace_editor" && command && path) {
    switch (command) {
      case "create":
        return `Creating ${path}`;
      case "str_replace":
      case "insert":
        return `Editing ${path}`;
      case "view":
        return `Reading ${path}`;
      case "undo_edit":
        return `Undoing edit in ${path}`;
    }
  }

  if (toolName === "file_manager" && command && path) {
    const newPath = args.new_path as string | undefined;
    switch (command) {
      case "delete":
        return `Deleting ${path}`;
      case "rename":
        return newPath ? `Renaming ${path} → ${newPath}` : `Renaming ${path}`;
    }
  }

  return toolName;
}

export function ToolCallBadge({
  toolName,
  args,
  state,
  result,
}: ToolCallBadgeProps) {
  const label = getToolLabel(toolName, args);
  const isComplete = state === "result" && result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}

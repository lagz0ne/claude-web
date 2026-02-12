import { useState } from "react"
import { ChevronDown, ChevronRight, FileText, Terminal as TermIcon, Search, Globe, FolderOpen, Wrench } from "lucide-react"
import { CodeDiff } from "./CodeDiff"

type Props = {
  name: string
  input: Record<string, unknown>
}

export function ToolUse({ name, input }: Props) {
  if (name === "Edit") {
    return (
      <CodeDiff
        filePath={String(input.file_path || "unknown")}
        oldString={String(input.old_string || "")}
        newString={String(input.new_string || "")}
      />
    )
  }

  if (name === "Write") {
    return (
      <CodeDiff
        filePath={String(input.file_path || "unknown")}
        oldString=""
        newString={String(input.content || "")}
      />
    )
  }

  return <GenericToolUse name={name} input={input} />
}

function GenericToolUse({ name, input }: Props) {
  const [open, setOpen] = useState(false)
  const summary = getSummary(name, input)
  const Icon = getToolIcon(name)

  return (
    <div className="overflow-hidden my-0.5 border-l-2 border-amber-500/50 bg-amber-500/[0.06]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-amber-500/[0.10] active:bg-amber-500/[0.14] transition-colors"
      >
        <Icon className="w-3 h-3 text-amber-600 shrink-0" />
        <span className="font-mono text-[11px] font-bold text-foreground/65">{name}</span>
        {summary && (
          <span className="text-foreground/40 text-[11px] font-mono truncate flex-1">{summary}</span>
        )}
        {open ? (
          <ChevronDown className="w-3 h-3 text-foreground/30 shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 text-foreground/30 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-2.5 py-2 border-t border-amber-500/20">
          <pre className="text-[10px] font-mono overflow-x-auto whitespace-pre-wrap break-all text-foreground/45 leading-relaxed">
            {JSON.stringify(input, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

function getToolIcon(name: string) {
  switch (name) {
    case "Read": return FileText
    case "Bash": return TermIcon
    case "Glob": return FolderOpen
    case "Grep": return Search
    case "WebFetch": return Globe
    case "WebSearch": return Globe
    default: return Wrench
  }
}

function getSummary(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case "Read":
      return String(input.file_path || "")
    case "Bash":
      return String(input.command || "").slice(0, 80)
    case "Glob":
      return String(input.pattern || "")
    case "Grep":
      return String(input.pattern || "")
    case "WebFetch":
      return String(input.url || "").slice(0, 60)
    case "Task":
      return String(input.description || "")
    default:
      return ""
  }
}

import { useState } from "react"
import { ChevronDown, ChevronRight, CheckCircle, XCircle } from "lucide-react"

type Props = {
  toolUseId: string
  content: unknown
  isError?: boolean
}

export function ToolResult({ content, isError }: Props) {
  const [open, setOpen] = useState(false)
  const text = extractText(content)
  const lines = text.split("\n")
  const preview = lines.slice(0, 2).join("\n")
  const hasMore = lines.length > 2

  return (
    <div className={`rounded-md overflow-hidden my-0.5 border-l-2 ${isError ? "border-red-400/50 bg-red-50/40" : "border-emerald-400/40 bg-emerald-50/40"}`}>
      <button
        onClick={() => hasMore && setOpen(!open)}
        className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left ${hasMore ? "hover:bg-foreground/[0.04] cursor-pointer" : "cursor-default"} transition-colors`}
      >
        {isError ? (
          <XCircle className="w-3 h-3 text-red-600 shrink-0" />
        ) : (
          <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
        )}
        <span className="text-[11px] text-foreground/45 truncate flex-1 font-mono">
          {preview || "(empty)"}
        </span>
        {hasMore && (
          open ? (
            <ChevronDown className="w-3 h-3 text-foreground/35 shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-foreground/35 shrink-0" />
          )
        )}
      </button>
      {open && hasMore && (
        <div className="px-2.5 py-2 border-t border-foreground/[0.08] max-h-64 overflow-y-auto">
          <pre className="text-[10px] font-mono overflow-x-auto whitespace-pre-wrap break-all text-foreground/50 leading-relaxed">
            {text}
          </pre>
        </div>
      )}
    </div>
  )
}

function extractText(content: unknown): string {
  if (typeof content === "string") return content
  if (Array.isArray(content)) {
    return content
      .map((block: any) => {
        if (typeof block === "string") return block
        if (block.type === "text") return block.text
        return JSON.stringify(block)
      })
      .join("\n")
  }
  return JSON.stringify(content, null, 2)
}

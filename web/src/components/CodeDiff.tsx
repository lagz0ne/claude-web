import { useState, useMemo } from "react"
import { FileCode, FilePlus, Maximize2 } from "lucide-react"
import { ArtifactOverlay } from "./ArtifactOverlay"

type DiffLine = {
  type: "context" | "add" | "remove"
  content: string
}

const CONTEXT = 3

function computeDiff(oldStr: string, newStr: string): DiffLine[] {
  const oldLines = oldStr ? oldStr.split("\n") : []
  const newLines = newStr ? newStr.split("\n") : []

  const oldEmpty = !oldLines.length || (oldLines.length === 1 && !oldLines[0])
  const newEmpty = !newLines.length || (newLines.length === 1 && !newLines[0])

  if (oldEmpty) return newLines.map((content) => ({ type: "add", content }))
  if (newEmpty) return oldLines.map((content) => ({ type: "remove", content }))

  let prefix = 0
  while (prefix < oldLines.length && prefix < newLines.length && oldLines[prefix] === newLines[prefix]) prefix++

  let suffix = 0
  while (
    suffix < oldLines.length - prefix &&
    suffix < newLines.length - prefix &&
    oldLines[oldLines.length - 1 - suffix] === newLines[newLines.length - 1 - suffix]
  ) suffix++

  const result: DiffLine[] = []

  const ctxStart = Math.max(0, prefix - CONTEXT)
  for (let i = ctxStart; i < prefix; i++) {
    result.push({ type: "context", content: oldLines[i] })
  }
  for (let i = prefix; i < oldLines.length - suffix; i++) {
    result.push({ type: "remove", content: oldLines[i] })
  }
  for (let i = prefix; i < newLines.length - suffix; i++) {
    result.push({ type: "add", content: newLines[i] })
  }
  const suffixStart = oldLines.length - suffix
  for (let i = 0; i < Math.min(suffix, CONTEXT); i++) {
    result.push({ type: "context", content: oldLines[suffixStart + i] })
  }

  return result
}

type Props = {
  filePath: string
  oldString: string
  newString: string
}

function DiffLines({ lines }: { lines: DiffLine[] }) {
  return (
    <>
      {lines.map((line, i) => (
        <div key={i} className={`diff-ln diff-ln--${line.type}`}>
          <span className="diff-gutter">
            {line.type === "add" ? "+" : line.type === "remove" ? "\u2212" : "\u00a0"}
          </span>
          <pre className="diff-code">{line.content || "\u00a0"}</pre>
        </div>
      ))}
    </>
  )
}

export function CodeDiff({ filePath, oldString, newString }: Props) {
  const [expanded, setExpanded] = useState(false)
  const lines = useMemo(() => computeDiff(oldString, newString), [oldString, newString])
  const adds = lines.filter((l) => l.type === "add").length
  const removes = lines.filter((l) => l.type === "remove").length
  const isNew = !oldString
  const fileName = filePath.split("/").pop() || filePath

  return (
    <>
      <div className="diff -mx-3 sm:mx-0 overflow-hidden my-1.5">
        <div
          className="diff-header cursor-pointer hover:bg-white/[0.04] transition-colors"
          onClick={() => setExpanded(true)}
        >
          {isNew ? (
            <FilePlus className="w-3.5 h-3.5 shrink-0 opacity-70" />
          ) : (
            <FileCode className="w-3.5 h-3.5 shrink-0 opacity-70" />
          )}
          <span className="diff-filename">{fileName}</span>
          <span className="diff-filepath">{filePath}</span>
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {adds > 0 && <span className="diff-stat-add">+{adds}</span>}
            {removes > 0 && <span className="diff-stat-rm">-{removes}</span>}
            <Maximize2 className="w-3 h-3 text-white/30" />
          </div>
        </div>
        <div className="diff-body">
          <DiffLines lines={lines} />
        </div>
      </div>

      {expanded && (
        <ArtifactOverlay onClose={() => setExpanded(false)} label={`${fileName} — ${filePath}`}>
          <div className="diff diff--expanded">
            <div className="diff-body">
              <DiffLines lines={lines} />
            </div>
          </div>
        </ArtifactOverlay>
      )}
    </>
  )
}

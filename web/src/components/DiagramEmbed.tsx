import { useState, useEffect, useRef } from "react"
import { Shapes, ExternalLink, AlertTriangle, Loader2, Maximize2 } from "lucide-react"
import { ArtifactOverlay } from "./ArtifactOverlay"

const DIASHORT_BASE = "https://diashort.apps.quickable.co"

type Props = {
  source: string
  format: "mermaid" | "d2"
}

export function DiagramEmbed({ source, format }: Props) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [viewUrl, setViewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const sentRef = useRef(false)

  useEffect(() => {
    if (sentRef.current) return
    sentRef.current = true

    fetch(`${DIASHORT_BASE}/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, format }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Render failed (${r.status})`)
        return r.json()
      })
      .then((data) => {
        setEmbedUrl(`${data.embed}?theme=light`)
        setViewUrl(data.url)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [source, format])

  if (loading) {
    return (
      <div className="diagram diagram--loading">
        <Loader2 className="w-4 h-4 animate-spin opacity-40" />
        <span className="text-xs font-mono opacity-40">rendering {format}...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="diagram diagram--error">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span className="text-xs font-mono">{error}</span>
      </div>
    )
  }

  return (
    <>
      <div className="diagram -mx-3 sm:mx-0 overflow-hidden my-1.5">
        <div className="diagram-header">
          <Shapes className="w-3.5 h-3.5 shrink-0 opacity-70" />
          <span className="text-xs font-mono opacity-70">{format}</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setExpanded(true)}
              className="p-1.5 -m-1.5 opacity-50 hover:opacity-100 transition-opacity"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            {viewUrl && (
              <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="opacity-50 hover:opacity-100 transition-opacity">
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
        <div className="diagram-body cursor-pointer" onClick={() => setExpanded(true)}>
          <img src={embedUrl!} alt={`${format} diagram`} className="w-full" />
        </div>
      </div>

      {expanded && (
        <ArtifactOverlay onClose={() => setExpanded(false)} label={format.toUpperCase()}>
          <div className="flex items-center justify-center min-h-full bg-white p-4">
            <img src={embedUrl!} alt={`${format} diagram`} className="max-w-full max-h-full" />
          </div>
        </ArtifactOverlay>
      )}
    </>
  )
}

export function DiagramUrlEmbed({ url }: { url: string }) {
  const [expanded, setExpanded] = useState(false)
  const embedUrl = toEmbedUrl(url)
  const viewUrl = toViewUrl(url)

  return (
    <>
      <div className="diagram -mx-3 sm:mx-0 overflow-hidden my-1.5">
        <div className="diagram-header">
          <Shapes className="w-3.5 h-3.5 shrink-0 opacity-70" />
          <span className="text-xs font-mono opacity-70">diagram</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setExpanded(true)}
              className="p-1.5 -m-1.5 opacity-50 hover:opacity-100 transition-opacity"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="opacity-50 hover:opacity-100 transition-opacity">
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <div className="diagram-body cursor-pointer" onClick={() => setExpanded(true)}>
          <img src={embedUrl} alt="diagram" className="w-full" />
        </div>
      </div>

      {expanded && (
        <ArtifactOverlay onClose={() => setExpanded(false)} label="DIAGRAM">
          <div className="flex items-center justify-center min-h-full bg-white p-4">
            <img src={embedUrl} alt="diagram" className="max-w-full max-h-full" />
          </div>
        </ArtifactOverlay>
      )}
    </>
  )
}

function toEmbedUrl(url: string): string {
  let embed = url.replace(`${DIASHORT_BASE}/d/`, `${DIASHORT_BASE}/e/`)
  if (!embed.includes("?")) embed += "?theme=light"
  return embed
}

function toViewUrl(url: string): string {
  return url.replace(`${DIASHORT_BASE}/e/`, `${DIASHORT_BASE}/d/`).split("?")[0]
}

export function isDiashortUrl(url: string): boolean {
  return /^https:\/\/diashort\.apps\.quickable\.co\/[de]\/[a-zA-Z0-9]+/.test(url)
}

export const DIASHORT_URL_RE = /https:\/\/diashort\.apps\.quickable\.co\/[de]\/[a-zA-Z0-9]+(?:\/[a-zA-Z0-9]+)?/g

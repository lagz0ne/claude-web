import { useState, useEffect, useRef } from "react"
import { Shapes, ExternalLink, AlertTriangle, Loader2 } from "lucide-react"

type Props = {
  source: string
  format: "mermaid" | "d2"
}

export function DiagramEmbed({ source, format }: Props) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [viewUrl, setViewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const sentRef = useRef(false)

  useEffect(() => {
    if (sentRef.current) return
    sentRef.current = true

    fetch("https://diashort.apps.quickable.co/render", {
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
    <div className="diagram -mx-3 sm:mx-0 sm:rounded-lg overflow-hidden my-1.5">
      <div className="diagram-header">
        <Shapes className="w-3.5 h-3.5 shrink-0 opacity-70" />
        <span className="text-xs font-mono opacity-70">{format}</span>
        {viewUrl && (
          <a href={viewUrl} target="_blank" rel="noopener noreferrer" className="ml-auto opacity-50 hover:opacity-100 transition-opacity">
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      <div className="diagram-body">
        <img src={embedUrl!} alt={`${format} diagram`} className="w-full" />
      </div>
    </div>
  )
}

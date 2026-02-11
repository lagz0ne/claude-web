import { useCallback } from "react"
import { X, Plus, MessageSquare, Trash2 } from "lucide-react"
import type { SessionInfo } from "@/lib/ws"

type Props = {
  open: boolean
  onClose: () => void
  sessions: SessionInfo[]
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onNewSession: () => void
  onKillSession: (id: string) => void
}

export function SessionSidebar({
  open,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onKillSession,
}: Props) {
  const handleNew = useCallback(() => {
    onNewSession()
    onClose()
  }, [onNewSession, onClose])

  const handleSelect = useCallback((id: string) => {
    onSelectSession(id)
    onClose()
  }, [onSelectSession, onClose])

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 left-0 bottom-0 w-72 bg-background border-r border-foreground/[0.10] z-50 transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/[0.10]">
          <h2 className="text-xs font-mono font-semibold text-foreground/70 uppercase tracking-wider">sessions</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-foreground/[0.06] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-4 h-4 text-foreground/50" />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={handleNew}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-foreground/20 hover:bg-foreground/[0.04] transition-colors text-sm font-mono text-foreground/60 min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5" />
            new session
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] ${
                s.id === activeSessionId
                  ? "bg-foreground/[0.07] text-foreground"
                  : "hover:bg-foreground/[0.04] text-foreground/70"
              }`}
            >
              <button
                onClick={() => handleSelect(s.id)}
                className="flex-1 flex items-center gap-2.5 text-left min-w-0"
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono truncate">{s.cwd.split("/").pop()}</p>
                  <p className="text-[10px] text-foreground/40 font-mono">
                    {s.messageCount} msgs · {formatTime(s.createdAt)}
                  </p>
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onKillSession(s.id)
                }}
                className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          {sessions.length === 0 && (
            <p className="text-[11px] text-foreground/35 text-center py-8 font-mono">
              no active sessions
            </p>
          )}
        </div>
      </div>
    </>
  )
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return "now"
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m`
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

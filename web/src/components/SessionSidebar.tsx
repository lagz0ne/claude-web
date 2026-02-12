import { useCallback } from "react"
import { X, Plus, MessageSquare, Trash2, Settings } from "lucide-react"
import type { SessionInfo } from "@/lib/ws"

type Props = {
  open: boolean
  onClose: () => void
  sessions: SessionInfo[]
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onNewSession: () => void
  onKillSession: (id: string) => void
  onOpenSettings?: () => void
}

export function SessionSidebar({
  open,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onKillSession,
  onOpenSettings,
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
          className="fixed inset-0 bg-black/60 z-40"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 left-0 bottom-0 w-72 bg-background border-r-2 border-foreground/[0.10] z-50 transition-transform duration-200 ease-out flex flex-col ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-3 py-0 border-b-2 border-foreground/[0.08]">
          <h2 className="text-[10px] font-mono font-bold text-foreground/50 uppercase tracking-[0.15em]">Sessions</h2>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-foreground/[0.06] active:bg-foreground/[0.10] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-4 h-4 text-foreground/50" />
          </button>
        </div>

        <div className="p-2">
          <button
            onClick={handleNew}
            className="w-full flex items-center gap-2 px-3 py-2.5 border-2 border-dashed border-foreground/15 hover:border-foreground/30 hover:bg-foreground/[0.03] transition-all text-sm font-mono text-foreground/50 min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5" />
            new session
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-px">
          {sessions.map((s) => {
            const isActive = s.id === activeSessionId
            const isEnded = s.status === "ended"
            return (
              <div
                key={s.id}
                className={`group flex items-center gap-2 px-3 py-2.5 transition-colors min-h-[44px] ${
                  isActive
                    ? "bg-foreground/[0.07] text-foreground border-l-2 border-foreground"
                    : isEnded
                      ? "hover:bg-foreground/[0.03] text-foreground/40 border-l-2 border-transparent"
                      : "hover:bg-foreground/[0.04] text-foreground/70 border-l-2 border-transparent"
                }`}
              >
                <button
                  onClick={() => handleSelect(s.id)}
                  className="flex-1 flex items-center gap-2.5 text-left min-w-0"
                >
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isEnded && !isActive ? "opacity-40" : ""}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-mono font-medium truncate ${isEnded && !isActive ? "opacity-60" : ""}`}>{s.cwd.split("/").pop()}</p>
                    <p className="text-[10px] text-foreground/35 font-mono">
                      {isEnded ? "ended" : `${s.messageCount} msgs`} · {formatTime(s.createdAt)}
                    </p>
                  </div>
                </button>
                {!isEnded && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onKillSession(s.id)
                    }}
                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )
          })}

          {sessions.length === 0 && (
            <p className="text-[11px] text-foreground/30 text-center py-8 font-mono uppercase tracking-wider">
              no active sessions
            </p>
          )}
        </div>

        {onOpenSettings && (
          <div className="p-2 border-t-2 border-foreground/[0.08] mt-auto">
            <button
              onClick={onOpenSettings}
              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-foreground/[0.04] active:bg-foreground/[0.08] transition-colors text-foreground/40 min-h-[44px]"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em]">Settings</span>
            </button>
          </div>
        )}
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

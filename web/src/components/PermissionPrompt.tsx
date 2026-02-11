import { useCallback } from "react"
import { Shield, X, Check } from "lucide-react"
import type { ServerMessage } from "@/lib/ws"

type Props = {
  msg: ServerMessage & { type: "permission_request" }
  onRespond: (allow: boolean) => void
}

export function PermissionPrompt({ msg, onRespond }: Props) {
  const deny = useCallback(() => onRespond(false), [onRespond])
  const allow = useCallback(() => onRespond(true), [onRespond])

  return (
    <div className="border-t border-foreground/[0.10] bg-amber-50/30 p-3 safe-bottom">
      <div className="max-w-2xl mx-auto space-y-2.5">
        <div className="flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="text-foreground/60">wants to use</span>{" "}
              <span className="font-mono font-medium">{msg.toolName}</span>
            </p>
            <pre className="text-[10px] font-mono text-foreground/50 mt-1.5 bg-foreground/[0.04] rounded-md p-2 overflow-x-auto max-h-24 overflow-y-auto leading-relaxed">
              {JSON.stringify(msg.input, null, 2)}
            </pre>
          </div>
        </div>
        <div className="flex gap-2 pl-[26px]">
          <button
            onClick={deny}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-foreground/[0.12] text-sm font-mono text-foreground/70 hover:bg-foreground/[0.04] transition-colors min-h-[44px]"
          >
            <X className="w-3.5 h-3.5" />
            deny
          </button>
          <button
            onClick={allow}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-foreground text-background text-sm font-mono font-medium hover:opacity-90 transition-opacity min-h-[44px]"
          >
            <Check className="w-3.5 h-3.5" />
            allow
          </button>
        </div>
      </div>
    </div>
  )
}

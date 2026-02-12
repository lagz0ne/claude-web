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
    <div className="border-t-2 border-amber-400/40 bg-amber-500/[0.06] p-3 safe-bottom">
      <div className="max-w-2xl mx-auto space-y-2.5">
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 bg-amber-500 flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="text-foreground/50 text-xs uppercase font-mono tracking-wider">wants to use</span>{" "}
              <span className="font-mono font-bold">{msg.toolName}</span>
            </p>
            <pre className="text-[10px] font-mono text-foreground/50 mt-1.5 bg-foreground/[0.04] border border-foreground/[0.08] p-2 overflow-x-auto max-h-24 overflow-y-auto leading-relaxed">
              {JSON.stringify(msg.input, null, 2)}
            </pre>
          </div>
        </div>
        <div className="flex gap-0 pl-[34px]">
          <button
            onClick={deny}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 border-2 border-foreground/[0.10] text-sm font-mono font-medium text-foreground/60 hover:bg-foreground/[0.04] active:bg-foreground/[0.08] transition-colors min-h-[44px]"
          >
            <X className="w-3.5 h-3.5" />
            DENY
          </button>
          <button
            onClick={allow}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-foreground text-background text-sm font-mono font-bold hover:opacity-85 active:opacity-70 transition-opacity min-h-[44px]"
          >
            <Check className="w-3.5 h-3.5" />
            ALLOW
          </button>
        </div>
      </div>
    </div>
  )
}

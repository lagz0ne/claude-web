import { useCallback } from "react"
import { Folder, ArrowRight, Star } from "lucide-react"
import { useWorkspaces } from "@/lib/queries"

type Workspace = {
  name: string
  cwd: string
  prompt?: string
}

type Props = {
  onLaunch: (cwd: string, prompt?: string) => void
}

export function PresetLauncher({ onLaunch }: Props) {
  const { data: workspaces } = useWorkspaces()

  const handleLaunch = useCallback((ws: Workspace) => {
    onLaunch(ws.cwd, ws.prompt)
  }, [onLaunch])

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-sm mx-auto space-y-6">
        <div className="space-y-1 pt-8 sm:pt-12">
          <h1 className="text-lg font-mono font-bold tracking-tight">
            claude<span className="text-foreground/30">/</span>web
          </h1>
          <p className="text-xs text-foreground/45 font-mono uppercase tracking-wider">Select a workspace</p>
        </div>

        <div className="space-y-0">
          {workspaces.map((ws) => (
            <button
              key={ws.name}
              onClick={() => handleLaunch(ws)}
              className="group w-full flex items-center gap-3 px-3.5 py-3.5 border-b border-foreground/[0.08] hover:bg-foreground/[0.03] active:bg-foreground/[0.06] transition-all text-left min-h-[52px]"
            >
              {ws.prompt ? (
                <Star className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-foreground/30 group-hover:text-foreground/60 transition-colors shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono font-semibold">{ws.name}</p>
                <p className="text-[11px] text-foreground/35 font-mono truncate">{ws.cwd}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-foreground/15 group-hover:text-foreground/40 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>

        {workspaces.length === 0 && (
          <div className="border-2 border-dashed border-foreground/10 p-6">
            <p className="text-sm text-foreground/35 font-mono text-center">
              no workspaces found
            </p>
            <p className="text-[11px] text-foreground/25 font-mono text-center mt-1">
              check config.json baseDir
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

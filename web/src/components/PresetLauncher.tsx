import { useState, useEffect, useCallback } from "react"
import { Folder, ArrowRight, Star } from "lucide-react"

type Workspace = {
  name: string
  cwd: string
  prompt?: string
}

type Props = {
  onLaunch: (cwd: string, prompt?: string) => void
}

export function PresetLauncher({ onLaunch }: Props) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])

  useEffect(() => {
    fetch("/api/workspaces")
      .then((r) => r.json())
      .then(setWorkspaces)
      .catch(() => setWorkspaces([]))
  }, [])

  const handleLaunch = useCallback((ws: Workspace) => {
    onLaunch(ws.cwd, ws.prompt)
  }, [onLaunch])

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <div className="w-full max-w-sm mx-auto space-y-6">
        <div className="space-y-1 pt-12">
          <h1 className="text-lg font-mono font-semibold tracking-tight">claude<span className="text-foreground/40">/</span>web</h1>
          <p className="text-xs text-foreground/50 font-mono">select a workspace to begin</p>
        </div>

        <div className="space-y-1">
          {workspaces.map((ws) => (
            <button
              key={ws.name}
              onClick={() => handleLaunch(ws)}
              className="group w-full flex items-center gap-3 px-3.5 py-3 rounded-lg border border-foreground/[0.10] hover:border-foreground/20 hover:bg-foreground/[0.03] transition-all text-left min-h-[44px]"
            >
              {ws.prompt ? (
                <Star className="w-4 h-4 text-amber-500 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-foreground/35 group-hover:text-blue-500 transition-colors shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono font-medium">{ws.name}</p>
                <p className="text-[11px] text-foreground/45 font-mono truncate">{ws.cwd}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-foreground/20 group-hover:text-foreground/50 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>

        {workspaces.length === 0 && (
          <p className="text-sm text-foreground/40 font-mono text-center py-8">
            no workspaces found — check config.json baseDir
          </p>
        )}
      </div>
    </div>
  )
}

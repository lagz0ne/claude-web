import { useState, useCallback, useEffect } from "react"
import { ArrowLeft, Trash2, Plus, ChevronUp, ChevronDown, Check, AlertTriangle, Moon, Sun } from "lucide-react"
import { useConfig, useUpdateConfig, type PresetConfig } from "@/lib/queries"

type Props = {
  onBack: () => void
}

export function Settings({ onBack }: Props) {
  const { data: config, isLoading } = useConfig()
  const updateConfig = useUpdateConfig()

  const [baseDir, setBaseDir] = useState("")
  const [presets, setPresets] = useState<PresetConfig[]>([])
  const [yolo, setYolo] = useState(false)
  const [saved, setSaved] = useState(false)

  const [darkMode, setDarkMode] = useState(
    () => document.documentElement.dataset.theme === "dark"
  )

  useEffect(() => {
    if (config) {
      setBaseDir(config.baseDir)
      setPresets(config.presets)
      setYolo(config.dangerouslySkipPermissions)
    }
  }, [config])

  const toggleDarkMode = useCallback(() => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.dataset.theme = next ? "dark" : "light"
    localStorage.setItem("theme", next ? "dark" : "light")
  }, [darkMode])

  const addPreset = useCallback(() => {
    setPresets((prev) => [...prev, { name: "" }])
  }, [])

  const removePreset = useCallback((index: number) => {
    setPresets((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updatePreset = useCallback((index: number, field: keyof PresetConfig, value: string) => {
    setPresets((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: field === "prompt" ? (value || undefined) : value } : p))
    )
  }, [])

  const movePreset = useCallback((index: number, direction: -1 | 1) => {
    setPresets((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [])

  const handleSave = useCallback(() => {
    if (!config) return
    updateConfig.mutate(
      {
        port: config.port,
        baseDir: baseDir.trim(),
        presets: presets.filter((p) => p.name.trim()),
        dangerouslySkipPermissions: yolo,
      },
      {
        onSuccess: () => {
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
        },
      }
    )
  }, [config, baseDir, presets, yolo, updateConfig])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[10px] font-mono font-bold text-foreground/30 uppercase tracking-[0.15em]">
          loading
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <div className="w-full max-w-sm mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 pt-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-foreground/[0.06] active:bg-foreground/[0.10] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2"
          >
            <ArrowLeft className="w-4 h-4 text-foreground/50" />
          </button>
          <h1 className="text-[10px] font-mono font-bold text-foreground/50 uppercase tracking-[0.15em]">
            Settings
          </h1>
        </div>

        {/* Dark Mode */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold text-foreground/50 uppercase tracking-[0.15em]">
            Appearance
          </label>
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-3 py-2.5 border-2 border-foreground/[0.10] min-h-[44px] transition-colors hover:bg-foreground/[0.04]"
          >
            <div className="w-5 h-5 bg-foreground flex items-center justify-center shrink-0">
              {darkMode ? (
                <Moon className="w-3 h-3 text-background" />
              ) : (
                <Sun className="w-3 h-3 text-background" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-mono font-semibold">{darkMode ? "DARK" : "LIGHT"}</p>
            </div>
            <span className="text-[10px] font-mono text-foreground/40 uppercase">
              tap to toggle
            </span>
          </button>
        </div>

        {/* Base Directory */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold text-foreground/50 uppercase tracking-[0.15em]">
            Base Directory
          </label>
          <input
            type="text"
            value={baseDir}
            onChange={(e) => setBaseDir(e.target.value)}
            placeholder="/home/user/dev"
            className="w-full px-3 py-2.5 border-2 border-foreground/[0.10] bg-transparent font-mono text-sm min-h-[44px] focus:border-foreground/30 focus:outline-none transition-colors placeholder:text-foreground/20"
          />
          <p className="text-[10px] font-mono text-foreground/40">
            root directory for workspace discovery
          </p>
        </div>

        {/* Workspaces */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold text-foreground/50 uppercase tracking-[0.15em]">
            Workspaces
          </label>

          <div className="border-2 border-foreground/[0.08]">
            {presets.map((preset, i) => (
              <div
                key={i}
                className="flex items-start gap-0 border-b border-foreground/[0.06] last:border-b-0"
              >
                {/* Reorder buttons */}
                <div className="flex flex-col border-r border-foreground/[0.06] shrink-0">
                  <button
                    onClick={() => movePreset(i, -1)}
                    disabled={i === 0}
                    className="p-1.5 hover:bg-foreground/[0.06] active:bg-foreground/[0.10] transition-colors disabled:opacity-20"
                  >
                    <ChevronUp className="w-3 h-3 text-foreground/40" />
                  </button>
                  <button
                    onClick={() => movePreset(i, 1)}
                    disabled={i === presets.length - 1}
                    className="p-1.5 hover:bg-foreground/[0.06] active:bg-foreground/[0.10] transition-colors disabled:opacity-20"
                  >
                    <ChevronDown className="w-3 h-3 text-foreground/40" />
                  </button>
                </div>

                {/* Fields */}
                <div className="flex-1 min-w-0 p-2.5 space-y-1.5">
                  <input
                    type="text"
                    value={preset.name}
                    onChange={(e) => updatePreset(i, "name", e.target.value)}
                    placeholder="folder-name"
                    className="w-full px-2 py-1.5 border border-foreground/[0.08] bg-transparent font-mono text-sm focus:border-foreground/30 focus:outline-none transition-colors placeholder:text-foreground/20"
                  />
                  <input
                    type="text"
                    value={preset.prompt || ""}
                    onChange={(e) => updatePreset(i, "prompt", e.target.value)}
                    placeholder="optional prompt hint"
                    className="w-full px-2 py-1.5 border border-foreground/[0.08] bg-transparent font-mono text-[11px] text-foreground/60 focus:border-foreground/30 focus:outline-none transition-colors placeholder:text-foreground/15"
                  />
                </div>

                {/* Delete */}
                <button
                  onClick={() => removePreset(i)}
                  className="p-2.5 hover:bg-red-500/10 hover:text-red-500 transition-colors shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5 text-foreground/30" />
                </button>
              </div>
            ))}

            {presets.length === 0 && (
              <p className="text-[10px] font-mono text-foreground/25 text-center py-6 uppercase tracking-wider">
                no workspaces pinned
              </p>
            )}
          </div>

          <button
            onClick={addPreset}
            className="w-full flex items-center gap-2 px-3 py-2.5 border-2 border-dashed border-foreground/15 hover:border-foreground/30 hover:bg-foreground/[0.03] transition-all text-sm font-mono text-foreground/40 min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5" />
            add workspace
          </button>
        </div>

        {/* YOLO Mode */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold text-foreground/50 uppercase tracking-[0.15em]">
            Permission Mode
          </label>
          <button
            onClick={() => setYolo(!yolo)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 border-2 min-h-[44px] transition-colors ${
              yolo
                ? "border-red-500/50 bg-red-500/[0.06]"
                : "border-foreground/[0.10] hover:bg-foreground/[0.04]"
            }`}
          >
            <div className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 transition-colors ${
              yolo ? "border-red-500 bg-red-500" : "border-foreground/20"
            }`}>
              {yolo && <Check className="w-3 h-3 text-white" />}
            </div>
            <div className="flex-1 text-left">
              <p className={`text-sm font-mono font-bold ${yolo ? "text-red-600" : ""}`}>YOLO MODE</p>
              <p className="text-[10px] font-mono text-foreground/40">
                bypass all permission checks
              </p>
            </div>
            {yolo && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
          </button>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={updateConfig.isPending}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider min-h-[44px] transition-colors ${
            saved
              ? "bg-emerald-600 text-white"
              : "bg-foreground text-background hover:bg-foreground/90 active:bg-foreground/80"
          } disabled:opacity-50`}
        >
          {saved ? (
            <>
              <Check className="w-3.5 h-3.5" />
              saved
            </>
          ) : updateConfig.isPending ? (
            "saving..."
          ) : (
            "save"
          )}
        </button>

        {updateConfig.isError && (
          <p className="text-[10px] font-mono text-red-500 uppercase tracking-wider">
            failed to save configuration
          </p>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from "react"
import { Star, Terminal, Sparkles } from "lucide-react"

type Command = {
  name: string
  description?: string
}

type Props = {
  cwd: string
  presetPrompt?: string
  onSend: (text: string) => void
}

export function QuickActions({ cwd, presetPrompt, onSend }: Props) {
  const [commands, setCommands] = useState<Command[]>([])

  useEffect(() => {
    if (!cwd) return
    fetch(`/api/commands?cwd=${encodeURIComponent(cwd)}`)
      .then((r) => r.json())
      .then(setCommands)
      .catch(() => setCommands([]))
  }, [cwd])

  const hasActions = !!presetPrompt || commands.length > 0

  if (!hasActions) return null

  return (
    <div className="quick-actions">
      <div className="quick-actions-scroll">
        {presetPrompt && (
          <button
            onClick={() => onSend(presetPrompt)}
            className="quick-chip quick-chip--preset"
          >
            <Star className="w-3 h-3" />
            <span>{presetPrompt}</span>
          </button>
        )}
        {commands.map((cmd) => (
          <button
            key={cmd.name}
            onClick={() => onSend(cmd.name)}
            className="quick-chip quick-chip--command"
            title={cmd.description}
          >
            <Terminal className="w-3 h-3" />
            <span>{cmd.name}</span>
          </button>
        ))}
        <button
          onClick={() => onSend("What can you help me with in this project?")}
          className="quick-chip quick-chip--hint"
        >
          <Sparkles className="w-3 h-3" />
          <span>explore</span>
        </button>
      </div>
    </div>
  )
}

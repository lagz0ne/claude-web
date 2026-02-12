import { useState, useRef, useEffect, useCallback } from "react"
import { ArrowUp } from "lucide-react"

type Props = {
  onSend: (text: string) => void
  disabled?: boolean
}

export function PromptInput({ onSend, disabled }: Props) {
  const [text, setText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px"
  }, [text])

  const submit = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText("")
  }, [text, disabled, onSend])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }, [submit])

  const canSend = !disabled && text.trim().length > 0

  return (
    <div className="border-t-2 border-foreground/[0.08] bg-background safe-bottom">
      <div className="max-w-2xl mx-auto flex items-end">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Claude..."
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none bg-transparent px-3 py-3 text-sm placeholder:text-foreground/30 focus:outline-none min-h-[48px] max-h-[120px] disabled:opacity-30 font-[inherit]"
        />
        <button
          onClick={submit}
          disabled={!canSend}
          className="shrink-0 w-[48px] h-[48px] bg-foreground text-background flex items-center justify-center transition-all disabled:opacity-10 hover:opacity-80 active:opacity-60"
        >
          <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

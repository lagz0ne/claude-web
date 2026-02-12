import { useState, useEffect, useRef } from "react"
import { Star, Terminal, Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import { useCommands } from "@/lib/queries"

type Props = {
  cwd: string
  presetPrompt?: string
  onSend: (text: string) => void
}

export function QuickActions({ cwd, presetPrompt, onSend }: Props) {
  const { data: commands } = useCommands(cwd)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 2)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2)
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", checkScroll, { passive: true })
    const ro = new ResizeObserver(checkScroll)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", checkScroll)
      ro.disconnect()
    }
  }, [commands])

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" })
  }

  const hasActions = !!presetPrompt || commands.length > 0

  if (!hasActions) return null

  return (
    <div className="quick-actions relative">
      {/* Left fade + arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-10 w-7 flex items-center justify-center bg-gradient-to-r from-background via-background/80 to-transparent"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-foreground/40" />
        </button>
      )}

      <div ref={scrollRef} className="quick-actions-scroll">
        {presetPrompt && (
          <button
            onClick={() => onSend(presetPrompt)}
            className="quick-chip quick-chip--preset"
          >
            <Star className="w-3 h-3 shrink-0" />
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
            <Terminal className="w-3 h-3 shrink-0" />
            <span>{cmd.name}</span>
          </button>
        ))}
        <button
          onClick={() => onSend("What can you help me with in this project?")}
          className="quick-chip quick-chip--hint"
        >
          <Sparkles className="w-3 h-3 shrink-0" />
          <span>explore</span>
        </button>
      </div>

      {/* Right fade + arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-10 w-7 flex items-center justify-center bg-gradient-to-l from-background via-background/80 to-transparent"
        >
          <ChevronRight className="w-3.5 h-3.5 text-foreground/40" />
        </button>
      )}
    </div>
  )
}

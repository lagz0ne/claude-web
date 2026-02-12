import { useEffect, useCallback, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

type Props = {
  onClose: () => void
  label?: string
  children: ReactNode
}

export function ArtifactOverlay({ onClose, label, children }: Props) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [handleKeyDown])

  return createPortal(
    <div className="fixed inset-0 z-40 flex flex-col bg-black/60" onClick={onClose}>
      <div
        className="flex items-center justify-between px-3 shrink-0 border-b border-white/10 bg-[#161b22]"
        onClick={(e) => e.stopPropagation()}
      >
        {label && (
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-white/60">
            {label}
          </span>
        )}
        <button
          onClick={onClose}
          className="ml-auto min-w-[44px] min-h-[44px] flex items-center justify-center text-white/50 hover:text-white/90 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div
        className="flex-1 overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

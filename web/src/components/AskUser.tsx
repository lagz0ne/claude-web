import { useState, useCallback } from "react"
import { HelpCircle, ArrowUp } from "lucide-react"
import type { ServerMessage } from "@/lib/ws"

type Props = {
  msg: ServerMessage & { type: "ask_user_question" }
  onRespond: (answers: Record<string, string>, questions: any[]) => void
}

export function AskUser({ msg, onRespond }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [freeText, setFreeText] = useState<Record<string, string>>({})

  const allAnswered = msg.questions.every((_: any, i: number) => answers[String(i)])

  const selectOption = useCallback((qIndex: number, label: string) => {
    setAnswers((prev) => ({ ...prev, [String(qIndex)]: label }))
  }, [])

  const submit = useCallback(() => {
    const merged = { ...answers }
    for (const [k, v] of Object.entries(freeText)) {
      if (v.trim()) merged[k] = v.trim()
    }
    onRespond(merged, msg.questions)
  }, [answers, freeText, onRespond, msg.questions])

  return (
    <div className="border-t-2 border-blue-400/40 bg-blue-50/30 p-3 safe-bottom">
      <div className="max-w-2xl mx-auto space-y-3 max-h-[60vh] overflow-y-auto">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 flex items-center justify-center shrink-0">
            <HelpCircle className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[10px] font-mono font-bold text-foreground/50 uppercase tracking-[0.15em]">Question</span>
        </div>

        {msg.questions.map((q: any, qi: number) => (
          <div key={qi} className="space-y-2 pl-[32px]">
            <p className="text-sm leading-relaxed font-medium">{q.question}</p>
            <div className="flex flex-wrap gap-1.5">
              {(q.options || []).map((opt: any, oi: number) => (
                <button
                  key={oi}
                  onClick={() => selectOption(qi, opt.label)}
                  className={`px-3 py-2 text-xs font-mono border-2 transition-all min-h-[44px] ${
                    answers[String(qi)] === opt.label
                      ? "border-foreground bg-foreground/[0.05] text-foreground"
                      : "border-foreground/[0.10] hover:border-foreground/25 text-foreground/55"
                  }`}
                >
                  <span className="font-semibold">{opt.label}</span>
                  {opt.description && (
                    <span className="block text-[10px] text-foreground/40 mt-0.5 font-normal">
                      {opt.description}
                    </span>
                  )}
                </button>
              ))}
              <button
                onClick={() => {
                  setFreeText((prev) => ({ ...prev, [String(qi)]: prev[String(qi)] ?? "" }))
                  selectOption(qi, "__other__")
                }}
                className={`px-3 py-2 text-xs font-mono border-2 transition-all min-h-[44px] ${
                  answers[String(qi)] === "__other__"
                    ? "border-foreground bg-foreground/[0.05] text-foreground"
                    : "border-foreground/[0.10] hover:border-foreground/25 text-foreground/55"
                }`}
              >
                other
              </button>
            </div>
            {answers[String(qi)] === "__other__" && (
              <input
                type="text"
                value={freeText[String(qi)] || ""}
                onChange={(e) =>
                  setFreeText((prev) => ({ ...prev, [String(qi)]: e.target.value }))
                }
                placeholder="type your answer..."
                className="w-full px-3 py-2 border-2 border-foreground/[0.12] bg-foreground/[0.02] text-sm font-mono placeholder:text-foreground/25 focus:outline-none focus:border-foreground/30 min-h-[44px]"
                autoFocus
              />
            )}
          </div>
        ))}

        <div className="pl-[32px]">
          <button
            onClick={submit}
            disabled={!allAnswered}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-foreground text-background text-sm font-mono font-bold transition-all disabled:opacity-10 hover:opacity-85 active:opacity-70 min-h-[44px]"
          >
            <ArrowUp className="w-3.5 h-3.5" strokeWidth={2.5} />
            SUBMIT
          </button>
        </div>
      </div>
    </div>
  )
}

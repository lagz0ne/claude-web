import { flow, typed } from "@pumped-fn/lite"
import { sessionStoreAtom } from "../atoms/session-store"

export const sendMessageFlow = flow({
  parse: typed<{ sessionId: string; text: string }>(),
  deps: { store: sessionStoreAtom },
  factory: (ctx, { store }) => {
    const { sessionId, text } = ctx.input
    const session = store.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)

    session.inputQueue.push({
      type: "user",
      message: { role: "user", content: text },
      parent_tool_use_id: null,
      session_id: sessionId,
    })
  },
})

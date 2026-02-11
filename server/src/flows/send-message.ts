import { flow, typed } from "@pumped-fn/lite"
import { sessionStoreAtom } from "../atoms/session-store"

export const sendMessageFlow = flow({
  parse: typed<{ sessionId: string; text: string }>(),
  deps: { store: sessionStoreAtom },
  factory: (ctx, { store }) => {
    const { sessionId, text } = ctx.input
    const session = store.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)

    const msg = {
      type: "user" as const,
      message: { role: "user" as const, content: text },
      parent_tool_use_id: null,
      session_id: sessionId,
    }

    // First message — bootstrap the SDK query
    if (session._startQuery) {
      const start = session._startQuery
      session._startQuery = undefined
      start(msg)
    } else {
      session.inputQueue.push(msg)
    }
  },
})

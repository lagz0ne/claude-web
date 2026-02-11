import { flow, typed } from "@pumped-fn/lite"
import { sessionStoreAtom } from "../atoms/session-store"
import { broadcastAtom } from "../atoms/broadcast"

export const killSessionFlow = flow({
  parse: typed<{ sessionId: string }>(),
  deps: { store: sessionStoreAtom, broadcast: broadcastAtom },
  factory: (ctx, { store, broadcast }) => {
    const { sessionId } = ctx.input
    const session = store.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)

    session.abortController.abort()
    store.delete(sessionId)
    broadcast({ type: "session_ended", sessionId })
  },
})

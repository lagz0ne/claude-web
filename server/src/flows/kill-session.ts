import { flow, typed } from "@pumped-fn/lite"
import { sessionStoreAtom } from "../atoms/session-store"
import { broadcastAtom } from "../atoms/broadcast"
import { persistenceResource } from "../atoms/persistence"

export const killSessionFlow = flow({
  parse: typed<{ sessionId: string }>(),
  deps: { store: sessionStoreAtom, broadcast: broadcastAtom, persistence: persistenceResource },
  factory: (ctx, { store, broadcast, persistence }) => {
    const { sessionId } = ctx.input
    const session = store.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)

    session.abortController.abort()
    store.delete(sessionId)
    persistence.updateSessionStatus(sessionId, "ended")
    broadcast({ type: "session_ended", sessionId })
  },
})

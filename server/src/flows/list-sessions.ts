import { flow } from "@pumped-fn/lite"
import { sessionStoreAtom } from "../atoms/session-store"
import { persistenceResource } from "../atoms/persistence"
import type { SessionInfo } from "../types"

export const listSessionsFlow = flow({
  deps: { store: sessionStoreAtom, persistence: persistenceResource },
  factory: (_ctx, { store, persistence }) => {
    const result = new Map<string, SessionInfo>()

    // Past sessions from persistence (ended)
    const allMeta = persistence.loadSessionsMeta()
    for (const [id, meta] of Object.entries(allMeta)) {
      result.set(id, {
        id,
        cwd: meta.cwd,
        createdAt: meta.createdAt,
        messageCount: 0,
        status: meta.status,
      })
    }

    // Active sessions override past entries
    for (const [id, session] of store) {
      result.set(id, {
        id,
        cwd: session.cwd,
        createdAt: session.createdAt,
        messageCount: session.messages.length,
        status: "active",
      })
    }

    return Array.from(result.values()).sort((a, b) => b.createdAt - a.createdAt)
  },
})

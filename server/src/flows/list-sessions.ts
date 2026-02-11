import { flow } from "@pumped-fn/lite"
import { sessionStoreAtom } from "../atoms/session-store"

export const listSessionsFlow = flow({
  deps: { store: sessionStoreAtom },
  factory: (_ctx, { store }) => {
    return Array.from(store.values()).map((s) => ({
      id: s.id,
      cwd: s.cwd,
      createdAt: s.createdAt,
      messageCount: s.messages.length,
    }))
  },
})

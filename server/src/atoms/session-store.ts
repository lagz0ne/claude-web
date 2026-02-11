import { atom } from "@pumped-fn/lite"
import type { SessionState } from "../types"

export const sessionStoreAtom = atom({
  factory: (ctx) => {
    const store = new Map<string, SessionState>()
    ctx.cleanup(() => {
      for (const [, session] of store) {
        session.abortController.abort()
      }
      store.clear()
    })
    return store
  },
})

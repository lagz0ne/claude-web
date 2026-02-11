import { atom } from "@pumped-fn/lite"
import type { ServerMessage } from "../types"

export type BroadcastFn = (message: ServerMessage) => void

export const broadcastAtom = atom<BroadcastFn>({
  factory: () => {
    return () => {}
  },
})

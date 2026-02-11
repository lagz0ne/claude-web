import { atom } from "@pumped-fn/lite"
import { query, type Query, type Options } from "@anthropic-ai/claude-agent-sdk"

export type SdkFactory = (params: { prompt: string | AsyncIterable<any>; options?: Options }) => Query

export const sdkFactoryAtom = atom<SdkFactory>({
  factory: () => {
    return (params) => query(params)
  },
})

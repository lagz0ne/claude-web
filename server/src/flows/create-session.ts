import { flow, typed } from "@pumped-fn/lite"
import { sdkFactoryAtom } from "../atoms/sdk-factory"
import { sessionStoreAtom } from "../atoms/session-store"
import { broadcastAtom } from "../atoms/broadcast"
import type { SessionState, PermissionResolver, SDKUserMessage, InputQueue } from "../types"
import { randomUUID } from "crypto"

function createInputQueue(): InputQueue {
  let resolveNext: ((msg: SDKUserMessage) => void) | null = null
  const buffer: SDKUserMessage[] = []

  return {
    push(msg: SDKUserMessage) {
      if (resolveNext) {
        const r = resolveNext
        resolveNext = null
        r(msg)
      } else {
        buffer.push(msg)
      }
    },
    iterable: {
      [Symbol.asyncIterator]() {
        return {
          next(): Promise<IteratorResult<SDKUserMessage>> {
            if (buffer.length > 0) {
              return Promise.resolve({ value: buffer.shift()!, done: false })
            }
            return new Promise((resolve) => {
              resolveNext = (msg) => resolve({ value: msg, done: false })
            })
          },
        }
      },
    },
  }
}

export const createSessionFlow = flow({
  parse: typed<{ cwd: string; prompt?: string }>(),
  deps: { sdkFactory: sdkFactoryAtom, store: sessionStoreAtom, broadcast: broadcastAtom },
  factory: (ctx, { sdkFactory, store, broadcast }) => {
    const { cwd, prompt } = ctx.input
    const abortController = new AbortController()
    const pendingPermissions = new Map<string, PermissionResolver>()
    const inputQueue = createInputQueue()

    const initialPrompt = prompt || "You are now connected via a web interface. Greet the user and let them know you're ready."

    const firstMessage: SDKUserMessage = {
      type: "user",
      message: { role: "user", content: initialPrompt },
      parent_tool_use_id: null,
      session_id: "",
    }

    async function* promptStream() {
      yield firstMessage
      yield* inputQueue.iterable
    }

    const q = sdkFactory({
      prompt: promptStream(),
      options: {
        cwd,
        abortController,
        permissionMode: "default",
        includePartialMessages: true,
        settingSources: ["user", "project"],
        systemPrompt: { type: "preset", preset: "claude_code" },
        canUseTool: async (toolName, input, options) => {
          if (toolName === "AskUserQuestion") {
            const questions = (input as any).questions || []
            broadcast({
              type: "ask_user_question",
              sessionId: session.id,
              questions,
              toolUseId: options.toolUseID,
            })
          } else {
            broadcast({
              type: "permission_request",
              sessionId: session.id,
              toolName,
              input,
              toolUseId: options.toolUseID,
              description: (input as any).description,
            })
          }

          return new Promise((resolve) => {
            pendingPermissions.set(options.toolUseID, { resolve })
          })
        },
      },
    })

    const session: SessionState = {
      id: randomUUID(),
      cwd,
      query: q,
      abortController,
      messages: [],
      createdAt: Date.now(),
      pendingPermissions,
      inputQueue,
    }

    store.set(session.id, session)

    broadcast({ type: "session_created", sessionId: session.id, cwd })

    ;(async () => {
      try {
        for await (const message of q) {
          session.messages.push(message)
          broadcast({ type: "sdk_message", sessionId: session.id, message })
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          broadcast({ type: "error", message: `Session ${session.id} error: ${err.message}` })
        }
      } finally {
        broadcast({ type: "session_ended", sessionId: session.id })
      }
    })()

    return session.id
  },
})

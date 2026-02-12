import { flow, typed } from "@pumped-fn/lite"
import { sdkFactoryAtom } from "../atoms/sdk-factory"
import { sessionStoreAtom } from "../atoms/session-store"
import { broadcastAtom, type BroadcastFn } from "../atoms/broadcast"
import { persistenceResource } from "../atoms/persistence"
import { configAtom } from "../atoms/config"
import type { SessionState, PermissionResolver, SDKUserMessage, InputQueue } from "../types"
import type { Query, Options } from "@anthropic-ai/claude-agent-sdk"
import { randomUUID } from "crypto"

export function createInputQueue(): InputQueue {
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

/** Creates the canUseTool callback for SDK permission handling */
export function createPermissionHandler(
  session: SessionState,
  broadcast: BroadcastFn,
): Options["canUseTool"] {
  return async (toolName, input, options) => {
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
      session.pendingPermissions.set(options.toolUseID, { resolve })
    })
  }
}

type PersistenceHandle = {
  appendMessage: (sessionId: string, message: unknown) => void
  updateSessionStatus: (id: string, status: "active" | "ended") => void
}

type MessageLoopOptions = {
  session: SessionState
  query: Query
  broadcast: BroadcastFn
  persistence: PersistenceHandle
  store: Map<string, SessionState>
  skipPersistCount?: number
}

/** Runs the SDK message loop — consumes messages, persists, and broadcasts */
export function runMessageLoop(opts: MessageLoopOptions) {
  const { session, query, broadcast, persistence, store, skipPersistCount = 0 } = opts
  session.query = query
  let messageIndex = 0

  ;(async () => {
    try {
      for await (const message of query) {
        session.messages.push(message)
        // Skip persisting replayed messages during resume
        if (messageIndex >= skipPersistCount) {
          persistence.appendMessage(session.id, message)
        }
        broadcast({ type: "sdk_message", sessionId: session.id, message })
        messageIndex++
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        broadcast({ type: "error", message: `Session ${session.id} error: ${err.message}` })
      }
    } finally {
      store.delete(session.id)
      persistence.updateSessionStatus(session.id, "ended")
      broadcast({ type: "session_ended", sessionId: session.id })
    }
  })()
}

export const createSessionFlow = flow({
  parse: typed<{ cwd: string; prompt?: string }>(),
  deps: { sdkFactory: sdkFactoryAtom, store: sessionStoreAtom, broadcast: broadcastAtom, persistence: persistenceResource, config: configAtom },
  factory: (ctx, { sdkFactory, store, broadcast, persistence, config }) => {
    const { cwd } = ctx.input
    const abortController = new AbortController()
    const pendingPermissions = new Map<string, PermissionResolver>()
    const inputQueue = createInputQueue()

    const session: SessionState = {
      id: randomUUID(),
      cwd,
      query: null,
      abortController,
      messages: [],
      createdAt: Date.now(),
      pendingPermissions,
      inputQueue,
    }

    const yolo = config.dangerouslySkipPermissions === true

    function startQuery(firstMessage: SDKUserMessage) {
      async function* promptStream() {
        yield firstMessage
        yield* inputQueue.iterable
      }

      const q = sdkFactory({
        prompt: promptStream(),
        options: {
          sessionId: session.id,
          cwd,
          abortController,
          permissionMode: yolo ? "bypassPermissions" : "default",
          ...(yolo ? { allowDangerouslySkipPermissions: true } : {}),
          includePartialMessages: true,
          settingSources: ["user", "project"],
          systemPrompt: { type: "preset", preset: "claude_code" },
          ...(!yolo ? { canUseTool: createPermissionHandler(session, broadcast) } : {}),
        },
      })

      persistence.saveSessionMeta(session.id, {
        cwd,
        createdAt: session.createdAt,
        status: "active",
        lastMessageAt: Date.now(),
      })

      runMessageLoop({ session, query: q, broadcast, persistence, store })
    }

    session._startQuery = startQuery

    store.set(session.id, session)
    broadcast({ type: "session_created", sessionId: session.id, cwd })

    return session.id
  },
})

import { flow, typed } from "@pumped-fn/lite"
import { sdkFactoryAtom } from "../atoms/sdk-factory"
import { sessionStoreAtom } from "../atoms/session-store"
import { broadcastAtom } from "../atoms/broadcast"
import { persistenceResource } from "../atoms/persistence"
import { configAtom } from "../atoms/config"
import { createInputQueue, createPermissionHandler, runMessageLoop } from "./create-session"
import type { SessionState, PermissionResolver } from "../types"

export const resumeSessionFlow = flow({
  parse: typed<{ sessionId: string }>(),
  deps: { sdkFactory: sdkFactoryAtom, store: sessionStoreAtom, broadcast: broadcastAtom, persistence: persistenceResource, config: configAtom },
  factory: (ctx, { sdkFactory, store, broadcast, persistence, config }) => {
    const { sessionId } = ctx.input

    // Check if already active
    if (store.has(sessionId)) {
      throw new Error(`Session ${sessionId} is already active`)
    }

    // Load metadata to get the cwd
    const allMeta = persistence.loadSessionsMeta()
    const meta = allMeta[sessionId]
    if (!meta) {
      throw new Error(`Session ${sessionId} not found in persistence`)
    }

    const abortController = new AbortController()
    const pendingPermissions = new Map<string, PermissionResolver>()
    const inputQueue = createInputQueue()

    const session: SessionState = {
      id: sessionId,
      cwd: meta.cwd,
      query: null,
      abortController,
      messages: [],
      createdAt: meta.createdAt,
      pendingPermissions,
      inputQueue,
    }

    // Start the SDK query with resume — SDK replays past messages
    const yolo = config.dangerouslySkipPermissions === true

    const q = sdkFactory({
      prompt: inputQueue.iterable,
      options: {
        resume: sessionId,
        cwd: meta.cwd,
        abortController,
        permissionMode: yolo ? "bypassPermissions" : "default",
        ...(yolo ? { allowDangerouslySkipPermissions: true } : {}),
        includePartialMessages: true,
        settingSources: ["user", "project"],
        systemPrompt: { type: "preset", preset: "claude_code" },
        ...(!yolo ? { canUseTool: createPermissionHandler(session, broadcast) } : {}),
      },
    })

    persistence.saveSessionMeta(sessionId, {
      ...meta,
      status: "active",
      lastMessageAt: Date.now(),
    })

    // Register session in store before starting loop to prevent race with send_message
    store.set(session.id, session)
    broadcast({ type: "session_created", sessionId: session.id, cwd: meta.cwd })

    // Load existing message count so we skip persisting replayed messages
    const existingMessages = persistence.loadMessages(sessionId)
    const skipPersistCount = existingMessages.length

    runMessageLoop({ session, query: q, broadcast, persistence, store, skipPersistCount })

    return session.id
  },
})

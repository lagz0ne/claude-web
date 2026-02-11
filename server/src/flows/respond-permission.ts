import { flow, typed } from "@pumped-fn/lite"
import { sessionStoreAtom } from "../atoms/session-store"

type RespondPermissionInput = {
  sessionId: string
  toolUseId: string
  allow: boolean
  updatedInput?: Record<string, unknown>
  answers?: Record<string, string>
  questions?: unknown[]
}

export const respondPermissionFlow = flow({
  parse: typed<RespondPermissionInput>(),
  deps: { store: sessionStoreAtom },
  factory: (ctx, { store }) => {
    const { sessionId, toolUseId, allow, updatedInput, answers, questions } = ctx.input
    const session = store.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)

    const pending = session.pendingPermissions.get(toolUseId)
    if (!pending) throw new Error(`No pending permission for toolUseId ${toolUseId}`)

    session.pendingPermissions.delete(toolUseId)

    if (answers && questions) {
      pending.resolve({
        behavior: "allow",
        updatedInput: { questions, answers },
      })
    } else if (allow) {
      pending.resolve({
        behavior: "allow",
        updatedInput: updatedInput || {},
      })
    } else {
      pending.resolve({
        behavior: "deny",
        message: "User denied this action",
      })
    }
  },
})

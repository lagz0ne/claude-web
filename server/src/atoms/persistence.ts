import { resource } from "@pumped-fn/lite"
import { join, basename } from "path"
import { mkdirSync, readFileSync, writeFileSync, appendFileSync, existsSync } from "fs"
import { pathsAtom } from "./paths"

function sanitizeId(id: string): string {
  const clean = basename(id).replace(/[^a-zA-Z0-9\-_]/g, "")
  if (!clean) throw new Error("Invalid session ID")
  return clean
}

export type SessionMeta = {
  cwd: string
  createdAt: number
  status: "active" | "ended"
  lastMessageAt: number
}

export const persistenceResource = resource({
  name: "persistence",
  deps: { paths: pathsAtom },
  factory: (_ctx, { paths }) => {
    const dataDir = paths.dataDir
    const messagesDir = join(dataDir, "messages")
    const sessionsPath = join(dataDir, "sessions.json")

    mkdirSync(messagesDir, { recursive: true })

    function readSessionsIndex(): Record<string, SessionMeta> {
      if (!existsSync(sessionsPath)) return {}
      try {
        return JSON.parse(readFileSync(sessionsPath, "utf-8"))
      } catch {
        return {}
      }
    }

    function writeSessionsIndex(index: Record<string, SessionMeta>) {
      writeFileSync(sessionsPath, JSON.stringify(index, null, 2))
    }

    return {
      saveSessionMeta(id: string, meta: SessionMeta) {
        const index = readSessionsIndex()
        index[id] = meta
        writeSessionsIndex(index)
      },

      loadSessionsMeta(): Record<string, SessionMeta> {
        return readSessionsIndex()
      },

      appendMessage(sessionId: string, message: unknown) {
        const filePath = join(messagesDir, `${sanitizeId(sessionId)}.jsonl`)
        appendFileSync(filePath, JSON.stringify(message) + "\n")
      },

      loadMessages(sessionId: string): unknown[] {
        const filePath = join(messagesDir, `${sanitizeId(sessionId)}.jsonl`)
        if (!existsSync(filePath)) return []
        try {
          const content = readFileSync(filePath, "utf-8").trim()
          if (!content) return []
          return content.split("\n").map((line) => JSON.parse(line))
        } catch {
          return []
        }
      },

      updateSessionStatus(id: string, status: "active" | "ended") {
        const index = readSessionsIndex()
        if (index[id]) {
          index[id].status = status
          index[id].lastMessageAt = Date.now()
          writeSessionsIndex(index)
        }
      },
    }
  },
})

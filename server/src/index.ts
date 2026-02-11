import { Hono } from "hono"
import { serveStatic } from "hono/bun"
import { createScope, preset } from "@pumped-fn/lite"
import { configAtom, listWorkspaces } from "./atoms/config"
import { broadcastAtom, type BroadcastFn } from "./atoms/broadcast"
import { createSessionFlow } from "./flows/create-session"
import { sendMessageFlow } from "./flows/send-message"
import { respondPermissionFlow } from "./flows/respond-permission"
import { listSessionsFlow } from "./flows/list-sessions"
import { killSessionFlow } from "./flows/kill-session"
import type { ClientMessage } from "./types"
import { resolve } from "path"

const clients = new Set<{ send: (data: string) => void }>()

const broadcast: BroadcastFn = (message) => {
  const data = JSON.stringify(message)
  for (const client of clients) {
    try {
      client.send(data)
    } catch {
      clients.delete(client)
    }
  }
}

const scope = createScope({
  presets: [preset(broadcastAtom, broadcast)],
})

const app = new Hono()

app.get("/api/workspaces", async (c) => {
  const config = await scope.resolve(configAtom)
  return c.json(listWorkspaces(config))
})

app.get("/api/sessions", async (c) => {
  const ctx = scope.createContext()
  try {
    const sessions = await ctx.exec({ flow: listSessionsFlow })
    return c.json(sessions)
  } finally {
    await ctx.close()
  }
})

async function handleClientMessage(raw: string) {
  let msg: ClientMessage
  try {
    msg = JSON.parse(raw)
  } catch {
    broadcast({ type: "error", message: "Invalid JSON" })
    return
  }

  const ctx = scope.createContext()
  try {
    switch (msg.type) {
      case "create_session": {
        await ctx.exec({ flow: createSessionFlow, input: { cwd: msg.cwd, prompt: msg.prompt } })
        break
      }
      case "send_message": {
        await ctx.exec({ flow: sendMessageFlow, input: { sessionId: msg.sessionId, text: msg.text } })
        break
      }
      case "permission_response": {
        await ctx.exec({
          flow: respondPermissionFlow,
          input: {
            sessionId: msg.sessionId,
            toolUseId: msg.toolUseId,
            allow: msg.allow,
            updatedInput: msg.updatedInput,
          },
        })
        break
      }
      case "ask_user_response": {
        await ctx.exec({
          flow: respondPermissionFlow,
          input: {
            sessionId: msg.sessionId,
            toolUseId: msg.toolUseId,
            allow: true,
            answers: msg.answers,
            questions: msg.questions,
          },
        })
        break
      }
      case "list_sessions": {
        const sessions = await ctx.exec({ flow: listSessionsFlow })
        broadcast({ type: "session_list", sessions })
        break
      }
      case "kill_session": {
        await ctx.exec({ flow: killSessionFlow, input: { sessionId: msg.sessionId } })
        break
      }
    }
  } catch (err: any) {
    broadcast({ type: "error", message: err.message })
  } finally {
    await ctx.close()
  }
}

// Serve static frontend (built web/dist)
const distPath = resolve(process.cwd(), "..", "web", "dist")
app.use("/*", serveStatic({ root: distPath }))
app.get("*", serveStatic({ root: distPath, path: "index.html" }))

async function main() {
  const config = await scope.resolve(configAtom)

  Bun.serve({
    port: config.port,
    fetch(req) {
      const url = new URL(req.url)

      if (url.pathname === "/ws") {
        const upgraded = this.upgrade(req)
        if (!upgraded) {
          return new Response("WebSocket upgrade failed", { status: 400 })
        }
        return undefined as any
      }

      return app.fetch(req)
    },
    websocket: {
      open(ws) {
        const client = { send: (data: string) => ws.send(data) }
        ;(ws as any).__client = client
        clients.add(client)
      },
      message(_ws, message) {
        handleClientMessage(typeof message === "string" ? message : new TextDecoder().decode(message))
      },
      close(ws) {
        const client = (ws as any).__client
        if (client) clients.delete(client)
      },
    },
  })

  console.log(`Claude Web server running on http://localhost:${config.port}`)
  console.log(`WebSocket endpoint: ws://localhost:${config.port}/ws`)
  console.log(`Static files: ${distPath}`)
  console.log(`Presets: ${config.presets.map((p) => p.name).join(", ") || "none"}`)
}

main()

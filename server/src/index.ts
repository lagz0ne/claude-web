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
import { resolve, join } from "path"
import { readdirSync, readFileSync } from "fs"

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

app.get("/api/commands", (c) => {
  const cwd = c.req.query("cwd")
  if (!cwd) return c.json([])

  const commands: { name: string; description?: string }[] = []

  // Scan .claude/commands/
  try {
    const cmdDir = join(cwd, ".claude", "commands")
    for (const file of readdirSync(cmdDir)) {
      if (!file.endsWith(".md")) continue
      const name = "/" + file.replace(/\.md$/, "")
      let description: string | undefined
      try {
        const content = readFileSync(join(cmdDir, file), "utf-8")
        // First non-frontmatter, non-empty line as description
        const lines = content.split("\n")
        let inFrontmatter = false
        for (const line of lines) {
          if (line.trim() === "---") { inFrontmatter = !inFrontmatter; continue }
          if (inFrontmatter) continue
          const trimmed = line.replace(/^#+\s*/, "").trim()
          if (trimmed) { description = trimmed.slice(0, 80); break }
        }
      } catch { /* skip */ }
      commands.push({ name, description })
    }
  } catch { /* no commands dir */ }

  // Scan .claude/plugins for skills
  try {
    const pluginsFile = join(cwd, ".claude", "local-plugins.json")
    const plugins = JSON.parse(readFileSync(pluginsFile, "utf-8"))
    if (Array.isArray(plugins)) {
      for (const plugin of plugins) {
        if (plugin.skills && Array.isArray(plugin.skills)) {
          for (const skill of plugin.skills) {
            if (skill.name) commands.push({ name: `/${skill.name}`, description: skill.description?.slice(0, 80) })
          }
        }
      }
    }
  } catch { /* no plugins */ }

  return c.json(commands)
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

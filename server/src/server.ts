import { Hono } from "hono"
import { serveStatic } from "hono/bun"
import { createScope, preset, flow, typed } from "@pumped-fn/lite"
import { configAtom, listWorkspaces } from "./atoms/config"
import { broadcastAtom, type BroadcastFn } from "./atoms/broadcast"
import { pathsAtom } from "./atoms/paths"
import { createSessionFlow } from "./flows/create-session"
import { sendMessageFlow } from "./flows/send-message"
import { respondPermissionFlow } from "./flows/respond-permission"
import { listSessionsFlow } from "./flows/list-sessions"
import { killSessionFlow } from "./flows/kill-session"
import { resumeSessionFlow } from "./flows/resume-session"
import { sessionStoreAtom } from "./atoms/session-store"
import { persistenceResource } from "./atoms/persistence"
import type { ClientMessage, AppConfig } from "./types"
import { join } from "path"
import { readdirSync, readFileSync, writeFileSync } from "fs"

const loadMessagesFlow = flow({
  parse: typed<{ sessionId: string }>(),
  deps: { persistence: persistenceResource },
  factory: (ctx, { persistence }) => persistence.loadMessages(ctx.input.sessionId),
})

const reconcileSessionsFlow = flow({
  deps: { persistence: persistenceResource },
  factory: (_ctx, { persistence }) => {
    const allMeta = persistence.loadSessionsMeta()
    for (const [id, meta] of Object.entries(allMeta)) {
      if (meta.status === "active") {
        persistence.updateSessionStatus(id, "ended")
      }
    }
  },
})

export type ServerOptions = {
  configPath: string
  dataDir: string
  distPath: string
  portOverride?: number
}

export async function startServer(options: ServerOptions) {
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
    presets: [
      preset(broadcastAtom, broadcast),
      preset(pathsAtom, { configPath: options.configPath, dataDir: options.dataDir }),
    ],
  })

  // --- Reconcile orphaned sessions from previous crashes ---
  {
    const ctx = scope.createContext()
    try {
      await ctx.exec({ flow: reconcileSessionsFlow })
    } finally {
      await ctx.close()
    }
  }

  const app = new Hono()

  // --- Config API ---

  app.get("/api/config", async (c) => {
    const config = await scope.resolve(configAtom)
    return c.json(config)
  })

  app.put("/api/config", async (c) => {
    let body: any
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "Invalid JSON" }, 400)
    }

    if (typeof body.baseDir !== "string" || !body.baseDir.trim()) {
      return c.json({ error: "baseDir is required" }, 400)
    }

    const paths = await scope.resolve(pathsAtom)

    const updated: AppConfig = {
      port: typeof body.port === "number" && body.port > 0 && body.port < 65536 ? body.port : 3111,
      baseDir: body.baseDir.trim(),
      presets: Array.isArray(body.presets)
        ? body.presets.filter((p: any) => typeof p.name === "string" && p.name.trim()).map((p: any) => ({
            name: String(p.name).trim(),
            ...(p.prompt ? { prompt: String(p.prompt) } : {}),
          }))
        : [],
      dangerouslySkipPermissions: body.dangerouslySkipPermissions === true,
    }

    writeFileSync(paths.configPath, JSON.stringify(updated, null, 2))

    const ctrl = scope.controller(configAtom)
    ctrl.set(updated)

    return c.json(updated)
  })

  // --- Workspace & Command API ---

  app.get("/api/workspaces", async (c) => {
    const config = await scope.resolve(configAtom)
    return c.json(listWorkspaces(config))
  })

  app.get("/api/commands", (c) => {
    const cwd = c.req.query("cwd")
    if (!cwd) return c.json([])

    const commands: { name: string; description?: string }[] = []

    try {
      const cmdDir = join(cwd, ".claude", "commands")
      for (const file of readdirSync(cmdDir)) {
        if (!file.endsWith(".md")) continue
        const name = "/" + file.replace(/\.md$/, "")
        let description: string | undefined
        try {
          const content = readFileSync(join(cmdDir, file), "utf-8")
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

  // --- Session API ---

  app.get("/api/sessions", async (c) => {
    const ctx = scope.createContext()
    try {
      const sessions = await ctx.exec({ flow: listSessionsFlow })
      return c.json(sessions)
    } finally {
      await ctx.close()
    }
  })

  app.get("/api/sessions/:id/messages", async (c) => {
    const id = c.req.param("id")
    const store = await scope.resolve(sessionStoreAtom)
    const active = store.get(id)
    if (active) {
      return c.json(active.messages)
    }

    const ctx = scope.createContext()
    try {
      const messages = await ctx.exec({ flow: loadMessagesFlow, input: { sessionId: id } })
      return c.json(messages)
    } finally {
      await ctx.close()
    }
  })

  // --- WebSocket message handler ---

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
        case "resume_session": {
          await ctx.exec({ flow: resumeSessionFlow, input: { sessionId: msg.sessionId } })
          break
        }
      }
    } catch (err: any) {
      broadcast({ type: "error", message: err.message })
    } finally {
      await ctx.close()
    }
  }

  // --- Static files ---

  app.use("/*", serveStatic({ root: options.distPath }))
  app.get("*", serveStatic({ root: options.distPath, path: "index.html" }))

  // --- Start server ---

  const config = await scope.resolve(configAtom)
  const port = options.portOverride ?? config.port

  Bun.serve({
    port,
    hostname: "127.0.0.1",
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

  console.log(`claude-ui running on http://localhost:${port}`)
  console.log(`  Config:  ${options.configPath}`)
  console.log(`  Data:    ${options.dataDir}`)
  console.log(`  Static:  ${options.distPath}`)
  console.log(`  Presets: ${config.presets.map((p) => p.name).join(", ") || "none"}`)
}

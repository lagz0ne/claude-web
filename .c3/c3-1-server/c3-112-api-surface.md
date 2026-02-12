---
id: c3-112
c3-version: 4
title: API Surface
type: component
category: feature
parent: c3-1
goal: Expose HTTP + WebSocket API for client communication
summary: Hono routes for REST endpoints + Bun WebSocket handler dispatching to flows
---

# API Surface

## Goal

Expose HTTP + WebSocket API for client communication.

## Container Connection

The linkage component connecting server to web. Without it, no external communication is possible. Serves as the entry point that dispatches all client requests to the appropriate flows.

## Dependencies

| Direction | What | From/To |
|-----------|------|---------|
| IN (uses) | Session lifecycle flows | c3-110 session-lifecycle |
| IN (uses) | Messaging flows | c3-111 messaging |
| IN (uses) | Config | c3-101 config |
| IN (uses) | Persistence | c3-106 persistence |
| IN (uses) | Session store | c3-104 session-store |
| OUT (provides) | HTTP REST API | c3-2 web (via HTTP) |
| OUT (provides) | WebSocket endpoint | c3-2 web (via WS) |

## Behavior

**REST endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/config` | Read current config |
| PUT | `/api/config` | Update config |
| GET | `/api/workspaces` | List workspaces from baseDir |
| GET | `/api/commands?cwd=` | List .claude/commands for a workspace |
| GET | `/api/sessions` | List all sessions (active + ended) |
| GET | `/api/sessions/:id/messages` | Load messages for a session |

**WebSocket messages (client -> server):**

| Type | Action |
|------|--------|
| `create_session` | Dispatch to createSessionFlow |
| `resume_session` | Dispatch to resumeSessionFlow |
| `send_message` | Dispatch to sendMessageFlow |
| `permission_response` | Dispatch to respondPermissionFlow |
| `ask_user_response` | Dispatch to respondPermissionFlow (with answers) |
| `list_sessions` | Dispatch to listSessionsFlow, broadcast result |
| `kill_session` | Dispatch to killSessionFlow |

**Static files:** Serves built web frontend via `serveStatic`.

## Code References

| File | Purpose |
|------|---------|
| `server/src/server.ts` | startServer function with Hono routes, WebSocket handler, Bun.serve |
| `server/src/index.ts` | Dev entry point calling startServer |
| `server/src/cli.ts` | CLI entry point with arg parsing and XDG path setup |
| `server/src/types.ts` | ClientMessage and ServerMessage type unions |

## Related Refs

| Ref | How It Serves Goal |
|-----|-------------------|
| [ref-flows](../../refs/ref-flows.md) | All WebSocket message types dispatch to @pumped-fn/lite flows via scope.createContext() |

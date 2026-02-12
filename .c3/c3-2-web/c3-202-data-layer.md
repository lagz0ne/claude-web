---
id: c3-202
c3-version: 4
title: Data Layer
type: component
category: foundation
parent: c3-2
goal: Provide data fetching and caching infrastructure via React Query
summary: React Query hooks for sessions, workspaces, messages, config, and commands
---

# Data Layer

## Goal

Provide data fetching and caching infrastructure via React Query.

## Container Connection

Provides all data access hooks that feature components use. Without it, features would need to manage their own fetch logic and caching. Also serves as the bridge between WebSocket real-time updates and REST historical data.

## Dependencies

| Direction | What | From/To |
|-----------|------|---------|
| IN (uses) | Server REST API | c3-1 server (via HTTP /api/*) |
| OUT (provides) | `useSessions()`, `useWorkspaces()`, `useSessionMessages()`, `useCommands()`, `useConfig()`, `useUpdateConfig()` | All web feature components |

## Behavior

- `useSessions()`: Fetches `/api/sessions`, initialData `[]`
- `useWorkspaces()`: Fetches `/api/workspaces`, initialData `[]`
- `useSessionMessages(id)`: Fetches `/api/sessions/:id/messages`, wraps raw SDK messages as ChatMessage
- `useCommands(cwd)`: Fetches `/api/commands?cwd=`, enabled only when cwd is provided
- `useConfig()` / `useUpdateConfig()`: GET/PUT `/api/config` with cache invalidation

QueryClient configured with `staleTime: 0` and `refetchOnWindowFocus: false`.

## Code References

| File | Purpose |
|------|---------|
| `web/src/lib/queries.ts` | All React Query hooks and fetch functions |
| `web/src/main.tsx` | QueryClient creation and QueryClientProvider setup |

## Related Refs

| Ref | How It Serves Goal |
|-----|-------------------|

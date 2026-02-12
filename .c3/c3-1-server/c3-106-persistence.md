---
id: c3-106
c3-version: 4
title: Persistence
type: component
category: foundation
parent: c3-1
goal: Persist session metadata and messages to disk
summary: JSONL message files + sessions.json index using @pumped-fn/lite resource
---

# Persistence

## Goal

Persist session metadata and messages to disk.

## Container Connection

Provides durable storage that session-lifecycle and api-surface use to survive server restarts. Without persistence, all session history would be lost on restart.

## Dependencies

| Direction | What | From/To |
|-----------|------|---------|
| IN (uses) | Filesystem paths | c3-102 paths |
| OUT (provides) | `persistenceResource` (save/load/update session meta, append/load messages) | c3-110 session-lifecycle, c3-112 api-surface |

## Behavior

- **Session metadata**: `sessions.json` — JSON object keyed by session ID with `{cwd, createdAt, status, lastMessageAt}`
- **Messages**: `messages/{sessionId}.jsonl` — one JSON object per line, append-only
- **Session ID sanitization**: `basename()` + regex strip to prevent path traversal

## Code References

| File | Purpose |
|------|---------|
| `server/src/atoms/persistence.ts` | persistenceResource with all CRUD operations |

## Related Refs

| Ref | How It Serves Goal |
|-----|-------------------|
| [ref-atoms](../../refs/ref-atoms.md) | Persistence uses `resource()` (a managed-lifecycle variant of atom) for directory initialization |

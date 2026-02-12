---
id: c3-104
c3-version: 4
title: Session Store
type: component
category: foundation
parent: c3-1
goal: Manage in-memory active session state
summary: Map of active SessionState objects with cleanup on scope disposal
---

# Session Store

## Goal

Manage in-memory active session state.

## Container Connection

Provides the in-memory registry of active sessions that session-lifecycle and messaging consult. Without the store, the server cannot route messages to running SDK queries or track pending permissions.

## Dependencies

| Direction | What | From/To |
|-----------|------|---------|
| OUT (provides) | `sessionStoreAtom` (Map<string, SessionState>) | c3-110 session-lifecycle, c3-111 messaging, c3-112 api-surface |

## Code References

| File | Purpose |
|------|---------|
| `server/src/atoms/session-store.ts` | sessionStoreAtom definition with cleanup handler |
| `server/src/types.ts` | SessionState type (id, cwd, query, abortController, messages, pendingPermissions, inputQueue) |

## Related Refs

| Ref | How It Serves Goal |
|-----|-------------------|
| [ref-atoms](../../refs/ref-atoms.md) | Session store is an atom with lifecycle cleanup (aborts active sessions on disposal) |

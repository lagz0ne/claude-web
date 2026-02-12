---
id: c3-110
c3-version: 4
title: Session Lifecycle
type: component
category: feature
parent: c3-1
goal: Create, resume, and kill Claude sessions with SDK integration
summary: Manages SDK query lifecycle with permission handling, message loop, and input queue
---

# Session Lifecycle

## Goal

Create, resume, and kill Claude sessions with SDK integration.

## Container Connection

Core feature that orchestrates the full session lifecycle. Without it, no Claude conversations can occur. Composes all foundation atoms (sdk-factory, session-store, broadcast, persistence).

## Dependencies

| Direction | What | From/To |
|-----------|------|---------|
| IN (uses) | SDK query factory | c3-105 sdk-factory |
| IN (uses) | Active session registry | c3-104 session-store |
| IN (uses) | Message broadcaster | c3-103 broadcast |
| IN (uses) | Disk persistence | c3-106 persistence |
| OUT (provides) | `createSessionFlow`, `resumeSessionFlow`, `killSessionFlow` | c3-112 api-surface |
| OUT (provides) | `createPermissionHandler`, `createInputQueue`, `runMessageLoop` | Shared utilities for create + resume |

## Behavior

**Create session:**
1. Generate UUID, create SessionState with empty messages and input queue
2. Register in session-store, broadcast `session_created`
3. Defer SDK query start until first user message (lazy initialization via `_startQuery`)
4. On first message: create async generator yielding first message + input queue, call sdkFactory
5. Run message loop: iterate SDK query, persist + broadcast each message

**Resume session:**
1. Load metadata from persistence, verify session is not already active
2. Create new SessionState with fresh abort controller and input queue
3. Start SDK query with `resume: sessionId` option (SDK replays past messages)
4. Skip persisting replayed messages (count existing messages, skip that many)

**Kill session:**
1. Abort the session's AbortController
2. Remove from store, update persistence status, broadcast `session_ended`

## Code References

| File | Purpose |
|------|---------|
| `server/src/flows/create-session.ts` | createSessionFlow, createInputQueue, createPermissionHandler, runMessageLoop |
| `server/src/flows/resume-session.ts` | resumeSessionFlow |
| `server/src/flows/kill-session.ts` | killSessionFlow |

## Related Refs

| Ref | How It Serves Goal |
|-----|-------------------|
| [ref-flows](../../refs/ref-flows.md) | All lifecycle operations are @pumped-fn/lite flows with typed inputs and declared deps |
| [ref-atoms](../../refs/ref-atoms.md) | Composes multiple atoms as flow dependencies |

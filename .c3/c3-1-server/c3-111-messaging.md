---
id: c3-111
c3-version: 4
title: Messaging
type: component
category: feature
parent: c3-1
goal: Route user messages and permission responses to active sessions
summary: send-message and respond-permission flows bridging WebSocket input to SDK sessions
---

# Messaging

## Goal

Route user messages and permission responses to active sessions.

## Container Connection

Handles the user-to-SDK communication path. Without it, users cannot send messages or respond to permission prompts, making sessions non-interactive.

## Dependencies

| Direction | What | From/To |
|-----------|------|---------|
| IN (uses) | Active session registry | c3-104 session-store |
| OUT (provides) | `sendMessageFlow`, `respondPermissionFlow` | c3-112 api-surface |

## Behavior

**Send message:**
1. Look up session in store
2. If `_startQuery` exists (first message), call it to bootstrap the SDK query
3. Otherwise, push message to session's input queue (async iterable)

**Respond to permission:**
1. Look up session and pending permission by toolUseId
2. For AskUserQuestion responses: resolve with `{behavior: "allow", updatedInput: {questions, answers}}`
3. For tool permission allows: resolve with `{behavior: "allow", updatedInput}`
4. For denials: resolve with `{behavior: "deny", message: "User denied this action"}`

## Code References

| File | Purpose |
|------|---------|
| `server/src/flows/send-message.ts` | sendMessageFlow — routes text to session input queue or bootstraps query |
| `server/src/flows/respond-permission.ts` | respondPermissionFlow — resolves pending permission promises |

## Related Refs

| Ref | How It Serves Goal |
|-----|-------------------|
| [ref-flows](../../refs/ref-flows.md) | Both operations are typed flows with session-store dependency |

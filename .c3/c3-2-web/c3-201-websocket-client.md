---
id: c3-201
c3-version: 4
title: WebSocket Client
type: component
category: foundation
parent: c3-2
goal: Maintain persistent WebSocket connection and route server messages to UI state
summary: useClaudeSocket hook with auto-reconnect, message routing, and session state management
---

# WebSocket Client

## Goal

Maintain persistent WebSocket connection and route server messages to UI state.

## Container Connection

The linkage component connecting web to server. All real-time communication flows through this hook. Without it, the UI cannot receive streaming messages, permission prompts, or session events.

## Dependencies

| Direction | What | From/To |
|-----------|------|---------|
| IN (uses) | React Query client | c3-202 data-layer |
| OUT (provides) | `useClaudeSocket()` hook (connected, send, activeSessionId, pendingPermission, pendingQuestion, isStreaming) | c3-210 chat-view, c3-212 interaction-prompts |

## Behavior

- Connects to `ws://host/ws` on mount, auto-reconnects after 2s on close
- Routes `sdk_message` to React Query cache (`["messages", sessionId]`)
- Routes `session_created` to set active session and invalidate sessions query
- Routes `session_ended` to invalidate sessions query and clear streaming state
- Routes `permission_request` and `ask_user_question` to pending state
- Provides `send()` for outbound WebSocket messages (typed ClientMessage)
- Provides `pushUserMessage()` to optimistically add user messages to cache

## Code References

| File | Purpose |
|------|---------|
| `web/src/lib/ws.ts` | useClaudeSocket hook, ServerMessage/ClientMessage/ChatMessage types |

## Related Refs

| Ref | How It Serves Goal |
|-----|-------------------|
| [ref-industrial-brutalist](../../refs/ref-industrial-brutalist.md) | Connection status indicator follows the design system (emerald/red states) |

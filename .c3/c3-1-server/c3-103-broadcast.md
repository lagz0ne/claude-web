---
id: c3-103
c3-version: 4
title: Broadcast
type: component
category: foundation
parent: c3-1
goal: Enable real-time message delivery to all WebSocket clients
summary: BroadcastFn atom injected via preset, iterates connected client set
---

# Broadcast

## Goal

Enable real-time message delivery to all WebSocket clients.

## Container Connection

Provides the broadcast mechanism that session-lifecycle and api-surface use to push SDK messages, session events, and errors to connected browsers. Without broadcast, no real-time updates reach the frontend.

## Dependencies

| Direction | What | From/To |
|-----------|------|---------|
| OUT (provides) | `broadcastAtom` (BroadcastFn) | c3-110 session-lifecycle, c3-112 api-surface |

## Code References

| File | Purpose |
|------|---------|
| `server/src/atoms/broadcast.ts` | broadcastAtom definition (no-op default) |
| `server/src/server.ts:45-56` | Real broadcast implementation injected via `preset(broadcastAtom, broadcast)` |

## Related Refs

| Ref | How It Serves Goal |
|-----|-------------------|
| [ref-atoms](../../refs/ref-atoms.md) | Broadcast uses atom preset injection to swap the no-op default with the real WebSocket broadcaster |

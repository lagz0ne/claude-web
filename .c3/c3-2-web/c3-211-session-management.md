---
id: c3-211
c3-version: 4
title: Session Management
type: component
category: feature
parent: c3-2
goal: Navigate and manage multiple sessions
summary: SessionSidebar with active/ended session list, URL-based routing, and session actions
---

# Session Management

## Goal

Navigate and manage multiple sessions.

## Container Connection

Provides session navigation that lets users switch between conversations. Without it, users would be stuck on a single session with no way to browse or manage others.

## Dependencies

| Direction | What | From/To |
|-----------|------|---------|
| IN (uses) | Session list | c3-202 data-layer (useSessions) |
| IN (uses) | Active session state | c3-201 websocket-client (activeSessionId, setActiveSessionId) |

## Behavior

- Sidebar panel with session list (active sessions shown with status indicator)
- Select session → updates activeSessionId → URL syncs to `/session/{id}`
- Kill session → sends `kill_session` WebSocket message
- "New Session" → navigates to landing page (clears activeSessionId)
- Browser back/forward → reads session ID from URL pathname
- Sidebar opens/closes as overlay

## Code References

| File | Purpose |
|------|---------|
| `web/src/components/SessionSidebar.tsx` | Session list UI with navigation and actions |
| `web/src/App.tsx:37-55` | URL sync via pushState and popstate listener |

## Related Refs

| Ref | How It Serves Goal |
|-----|-------------------|
| [ref-industrial-brutalist](../../refs/ref-industrial-brutalist.md) | Sidebar follows brutalist borders, typography, and interactive states |

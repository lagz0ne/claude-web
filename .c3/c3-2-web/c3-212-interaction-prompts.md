---
id: c3-212
c3-version: 4
title: Interaction Prompts
type: component
category: feature
parent: c3-2
goal: Handle SDK permission and question prompts in the browser
summary: PermissionPrompt and AskUser components with response callbacks
---

# Interaction Prompts

## Goal

Handle SDK permission and question prompts in the browser.

## Container Connection

Fulfills the "permission delegation to browser" abstract constraint. Without it, Claude sessions would hang indefinitely waiting for permission responses that never come.

## Dependencies

| Direction | What | From/To |
|-----------|------|---------|
| IN (uses) | Pending permission/question state | c3-201 websocket-client (pendingPermission, pendingQuestion) |
| IN (uses) | WebSocket send | c3-201 websocket-client (send) |

## Behavior

**PermissionPrompt:**
- Shown when `permission_request` received for the active session
- Displays tool name, input, and optional description
- DENY/ALLOW buttons → sends `permission_response` via WebSocket
- Input disabled while prompt is visible

**AskUser:**
- Shown when `ask_user_question` received for the active session
- Renders structured questions with multiple-choice options
- Submit → sends `ask_user_response` with answers and questions via WebSocket
- Input disabled while question is visible

## Code References

| File | Purpose |
|------|---------|
| `web/src/components/PermissionPrompt.tsx` | Permission prompt UI with deny/allow actions |
| `web/src/components/AskUser.tsx` | User question UI with option selection |

## Related Refs

| Ref | How It Serves Goal |
|-----|-------------------|
| [ref-industrial-brutalist](../../refs/ref-industrial-brutalist.md) | Prompts use amber (permission) and blue (question) color conventions; flush button layout |

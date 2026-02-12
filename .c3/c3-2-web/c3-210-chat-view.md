---
id: c3-210
c3-version: 4
title: Chat View
type: component
category: feature
parent: c3-2
goal: Render conversation messages in real-time
summary: MessageRenderer dispatching SDK message types to specialized renderers (text, tool use, tool result, system, user)
---

# Chat View

## Goal

Render conversation messages in real-time.

## Container Connection

The primary UI feature — renders the conversation between user and Claude. Without it, users cannot see Claude's responses, tool usage, or session results.

## Dependencies

| Direction | What | From/To |
|-----------|------|---------|
| IN (uses) | Session messages | c3-202 data-layer (useSessionMessages) |
| IN (uses) | Streaming state | c3-201 websocket-client (isStreaming) |

## Behavior

Renders a list of ChatMessage objects, dispatching by type:
- `user_message` → UserMessage component (icon badge + text)
- `sdk_message` with `type: "assistant"` → AssistantMessage (Bot badge + text blocks + tool_use blocks)
- `sdk_message` with `type: "result"` → ResultMessage (Done/Error status with cost, duration, tokens)
- `sdk_message` with `type: "system"` → SystemMessage (model, cwd, tools count)
- Streaming indicator shown when `isStreaming` is true

Sub-components for content blocks:
- `TextMessage` — Markdown rendering via react-markdown + remark-gfm
- `ToolUse` — Tool name and input display
- `ToolResult` — Tool execution result display
- `CodeDiff` — Code diff rendering
- `DiagramEmbed` — Diagram embedding

## Code References

| File | Purpose |
|------|---------|
| `web/src/components/MessageRenderer.tsx` | Main renderer, UserMessage, AssistantMessage, ResultMessage, SystemMessage |
| `web/src/components/TextMessage.tsx` | Markdown text rendering |
| `web/src/components/ToolUse.tsx` | Tool use block rendering |
| `web/src/components/ToolResult.tsx` | Tool result block rendering |
| `web/src/components/CodeDiff.tsx` | Code diff visualization |
| `web/src/components/DiagramEmbed.tsx` | Diagram embedding |
| `web/src/components/PromptInput.tsx` | Text input for sending messages |

## Related Refs

| Ref | How It Serves Goal |
|-----|-------------------|
| [ref-industrial-brutalist](../../refs/ref-industrial-brutalist.md) | All message renderers follow brutalist typography, icon badges, and spacing rules |

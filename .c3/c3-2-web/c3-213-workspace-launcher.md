---
id: c3-213
c3-version: 4
title: Workspace Launcher
type: component
category: feature
parent: c3-2
goal: Launch new sessions from workspace presets
summary: PresetLauncher for workspace selection + QuickActions toolbar for commands and hints
---

# Workspace Launcher

## Goal

Launch new sessions from workspace presets.

## Container Connection

Entry point for new sessions. Without it, users cannot start Claude conversations — they need to select a workspace (directory) first.

## Dependencies

| Direction | What | From/To |
|-----------|------|---------|
| IN (uses) | Workspace list | c3-202 data-layer (useWorkspaces) |
| IN (uses) | Commands list | c3-202 data-layer (useCommands) |
| IN (uses) | WebSocket send | c3-201 websocket-client (send) |

## Behavior

**PresetLauncher (landing page):**
- Lists workspaces from server (directories under baseDir)
- Preset workspaces shown with associated prompt
- Click workspace → sends `create_session` with cwd (and optional prompt)

**QuickActions (above input, in-session):**
- Horizontal scrolling toolbar with tab-like chips
- Shows `.claude/commands` for the active workspace
- Preset prompt shown as hint
- Scroll overflow indicators with gradient fade and chevron arrows

## Code References

| File | Purpose |
|------|---------|
| `web/src/components/PresetLauncher.tsx` | Landing page workspace grid |
| `web/src/components/QuickActions.tsx` | In-session command/hint toolbar with scroll management |

## Related Refs

| Ref | How It Serves Goal |
|-----|-------------------|
| [ref-industrial-brutalist](../../refs/ref-industrial-brutalist.md) | QuickActions follows specific chip design rules (tab-like, no radius, scroll fades) |

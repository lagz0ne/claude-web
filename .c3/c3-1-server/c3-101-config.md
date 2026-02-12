---
id: c3-101
c3-version: 4
title: Config
type: component
category: foundation
parent: c3-1
goal: Load and manage application configuration
summary: Reads config.json, provides AppConfig atom; lists workspaces from baseDir
---

# Config

## Goal

Load and manage application configuration.

## Container Connection

Provides the `AppConfig` (port, baseDir, presets) that the api-surface uses for server startup and workspace discovery. Without config, no workspaces can be listed and the server port is unknown.

## Dependencies

| Direction | What | From/To |
|-----------|------|---------|
| IN (uses) | Filesystem paths | c3-102 paths |
| OUT (provides) | `configAtom` (AppConfig) | c3-112 api-surface |
| OUT (provides) | `listWorkspaces()` | c3-112 api-surface |

## Code References

| File | Purpose |
|------|---------|
| `server/src/atoms/config.ts` | configAtom definition, listWorkspaces function |
| `server/src/types.ts` | AppConfig, PresetConfig, Workspace type definitions |

## Related Refs

| Ref | How It Serves Goal |
|-----|-------------------|
| [ref-atoms](../../refs/ref-atoms.md) | Config is exposed as an atom with preset override support |

---
id: c3-102
c3-version: 4
title: Paths
type: component
category: foundation
parent: c3-1
goal: Provide filesystem paths for config and data storage
summary: XDG-compliant path resolution for config and data directories
---

# Paths

## Goal

Provide filesystem paths for config and data storage.

## Container Connection

Provides path resolution that config and persistence depend on. Without paths, the server cannot locate its configuration file or data directory.

## Dependencies

| Direction | What | From/To |
|-----------|------|---------|
| OUT (provides) | `pathsAtom` (configPath, dataDir) | c3-101 config, c3-106 persistence |

## Code References

| File | Purpose |
|------|---------|
| `server/src/atoms/paths.ts` | pathsAtom definition with XDG path resolution |
| `server/src/cli.ts` | CLI entry point that overrides paths via preset injection |

## Related Refs

| Ref | How It Serves Goal |
|-----|-------------------|
| [ref-atoms](../../refs/ref-atoms.md) | Paths is an atom with default values overridable via scope presets |

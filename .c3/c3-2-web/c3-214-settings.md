---
id: c3-214
c3-version: 4
title: Settings
type: component
category: feature
parent: c3-2
goal: Configure application settings
summary: Settings component with config read/update via React Query mutations
---

# Settings

## Goal

Configure application settings.

## Container Connection

Allows users to customize the application (baseDir, port, presets). Without it, users would need to manually edit the config.json file.

## Dependencies

| Direction | What | From/To |
|-----------|------|---------|
| IN (uses) | Config data | c3-202 data-layer (useConfig, useUpdateConfig) |

## Code References

| File | Purpose |
|------|---------|
| `web/src/components/Settings.tsx` | Settings UI with config form and mutation |

## Related Refs

| Ref | How It Serves Goal |
|-----|-------------------|
| [ref-industrial-brutalist](../../refs/ref-industrial-brutalist.md) | Settings form follows brutalist input and button conventions |

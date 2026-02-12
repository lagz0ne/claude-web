---
id: c3-105
c3-version: 4
title: SDK Factory
type: component
category: foundation
parent: c3-1
goal: Abstract Claude SDK query creation
summary: Factory wrapping SDK's query() for testability and configuration
---

# SDK Factory

## Goal

Abstract Claude SDK query creation.

## Container Connection

Provides the SDK query factory that session-lifecycle uses to create Claude sessions. Abstracts the direct SDK dependency, enabling potential testing or alternative implementations.

## Dependencies

| Direction | What | From/To |
|-----------|------|---------|
| IN (uses) | `@anthropic-ai/claude-agent-sdk` query function | External: Claude Agent SDK |
| OUT (provides) | `sdkFactoryAtom` (SdkFactory) | c3-110 session-lifecycle |

## Code References

| File | Purpose |
|------|---------|
| `server/src/atoms/sdk-factory.ts` | sdkFactoryAtom wrapping `query()` from Claude Agent SDK |

## Related Refs

| Ref | How It Serves Goal |
|-----|-------------------|
| [ref-atoms](../../refs/ref-atoms.md) | SDK factory is an atom, overridable via preset for testing |

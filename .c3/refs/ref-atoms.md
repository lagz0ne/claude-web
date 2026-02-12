---
id: ref-atoms
c3-version: 4
title: Atom Pattern
goal: Document the @pumped-fn/lite atom and resource pattern for shared injectable state
scope: [c3-1]
---

# Atom Pattern

## Goal

Document the @pumped-fn/lite atom and resource pattern for shared injectable state.

## Choice

We use `atom()` and `resource()` from `@pumped-fn/lite` as the dependency injection primitive for all server-side shared state.

- **atom**: Singleton factory — created once per scope, optionally overridable via `preset()`
- **resource**: Managed-lifecycle atom — factory runs on first resolve, cleanup runs on scope disposal
- **scope**: Container that holds resolved atoms, accepts presets for overriding defaults
- **preset**: Mechanism to swap an atom's default factory with a concrete value at scope creation time

## Why

- Lightweight DI without class decorators or container frameworks
- Atoms are composable — one atom depends on another via `deps`
- Preset injection enables the server.ts to wire real implementations (e.g., broadcast function) without modifying atom definitions
- Resource variant handles lifecycle (e.g., persistence creates directories on init)
- Each atom is independently testable — swap any dependency via preset

## How

| Guideline | Example |
|-----------|---------|
| Define atoms in `server/src/atoms/` | `export const configAtom = atom({ deps: {...}, factory: ... })` |
| Declare dependencies via `deps` | `deps: { paths: pathsAtom }` — auto-resolved |
| Override defaults via presets | `preset(broadcastAtom, realBroadcastFn)` in scope creation |
| Use `resource()` for init side effects | `persistenceResource` creates directories on first resolve |
| Cleanup via `ctx.cleanup()` | `sessionStoreAtom` aborts all active sessions on disposal |

## Not This

| Alternative | Rejected Because |
|-------------|------------------|
| Raw module singletons | No override mechanism for testing; tight coupling |
| Class-based DI (inversify, tsyringe) | Heavier, requires decorators, overkill for this scale |
| Environment-based config only | Cannot inject complex objects (functions, Maps) |

## Scope

**Applies to:**
- All `server/src/atoms/*.ts` files
- Any new server-side shared state

**Does NOT apply to:**
- Web frontend (uses React hooks/context instead)
- Flow definitions (those follow ref-flows)

## Cited By

- c3-101 (config)
- c3-102 (paths)
- c3-103 (broadcast)
- c3-104 (session-store)
- c3-105 (sdk-factory)
- c3-106 (persistence)
- c3-110 (session-lifecycle)

---
id: ref-flows
c3-version: 4
title: Flow Pattern
goal: Document the @pumped-fn/lite flow pattern for typed business operations
scope: [c3-1]
---

# Flow Pattern

## Goal

Document the @pumped-fn/lite flow pattern for typed business operations.

## Choice

We use `flow()` from `@pumped-fn/lite` for all server-side business operations (session lifecycle, messaging, persistence queries).

- **flow**: Typed operation with declared dependencies, executed within a scoped context
- **typed<T>()**: Input parser that provides compile-time type safety for flow inputs
- **context**: Created per-request via `scope.createContext()`, closed after execution

## Why

- Flows enforce explicit dependency declaration — no hidden imports
- Input typing via `typed<T>()` catches errors at compile time
- Context isolation — each WebSocket message handler gets a fresh context
- Composable with atoms — flows declare atom dependencies that are auto-resolved
- Testable — swap any atom dependency via scope presets

## How

| Guideline | Example |
|-----------|---------|
| Define flows in `server/src/flows/` | `export const sendMessageFlow = flow({ parse: typed<{...}>(), deps: {...}, factory: ... })` |
| Type inputs with `typed<T>()` | `parse: typed<{ sessionId: string; text: string }>()` |
| Access input via `ctx.input` | `const { sessionId, text } = ctx.input` |
| Execute via scope context | `const ctx = scope.createContext(); await ctx.exec({ flow, input })` |
| Always close context | `try { ... } finally { await ctx.close() }` |

## Not This

| Alternative | Rejected Because |
|-------------|------------------|
| Plain async functions | No dependency declaration, no input typing, no context isolation |
| Express middleware chains | Coupled to HTTP framework, not usable with WebSocket |
| Service classes | Heavier abstraction, hides dependency graph |

## Scope

**Applies to:**
- All `server/src/flows/*.ts` files
- WebSocket message dispatching in `server/src/server.ts`

**Does NOT apply to:**
- Web frontend (uses React hooks and callbacks)
- Atom definitions (those follow ref-atoms)

## Cited By

- c3-110 (session-lifecycle)
- c3-111 (messaging)
- c3-112 (api-surface)

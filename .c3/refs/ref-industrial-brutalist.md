---
id: ref-industrial-brutalist
c3-version: 4
title: Industrial Brutalist Design
goal: Document the UI design system conventions governing all web components
scope: [c3-2]
---

# Industrial Brutalist Design

## Goal

Document the UI design system conventions governing all web components.

## Choice

The web UI follows an **Industrial Brutalist** aesthetic: utilitarian, geometric, high-contrast, zero ornamentation. The full specification lives in `CLAUDE.md` under "UI Design System". This ref captures the architectural choice and key constraints.

## Why

- Distinctive visual identity — not generic AI chat UI
- Performance — no shadows, gradients, or blur effects means simpler CSS
- Accessibility — high contrast, minimum 44px touch targets, clear typography hierarchy
- Consistency — rigid rules prevent visual drift across components

## How

| Guideline | Implementation |
|-----------|----------------|
| Zero border radius | `* { border-radius: 0 !important; }` in globals.css; never write `rounded-*` |
| Border hierarchy | `border-2` structural, `border` content, `border-l-2` state, `border-dashed` placeholder |
| Typography | Body: Instrument Sans, Mono: JetBrains Mono; labels: `text-[10px] font-mono font-bold uppercase tracking-[0.15em]` |
| Color = function | foreground `#0a0a0a`, background `#fafafa`; emerald=success, red=error, amber=warning, blue=info |
| No decoration | No shadows, no gradients (except scroll fades), no blur, no rounded corners, no emojis |
| Icons | lucide-react only; square badges, not circles |
| Touch targets | Minimum `min-h-[44px]` / `min-w-[44px]` on all interactive elements |

## Not This

| Alternative | Rejected Because |
|-------------|------------------|
| Material Design | Generic, overused, introduces shadows and rounded corners |
| Tailwind UI defaults | Rounded, shadowed, too polished for the intended aesthetic |
| Custom design tokens system | Over-engineering for a single-app UI |

## Scope

**Applies to:**
- All `web/src/components/*.tsx` files
- All CSS in `web/src/styles/globals.css`
- Any new UI component added to the web container

**Does NOT apply to:**
- Server container (no UI)

## Override

The full specification in `CLAUDE.md` is the authoritative source. This ref serves as the C3 pointer to that specification.

## Cited By

- c3-201 (websocket-client)
- c3-210 (chat-view)
- c3-211 (session-management)
- c3-212 (interaction-prompts)
- c3-213 (workspace-launcher)
- c3-214 (settings)

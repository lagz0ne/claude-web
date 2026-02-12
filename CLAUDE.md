# Claude Web

## Project Structure

- `web/` — React 19 + Vite + Tailwind CSS 4 frontend (port 5111)
- `server/` — Hono + Claude Agent SDK backend (port 3111)
- Monorepo managed by Bun workspaces

## Type Checking

Use `bunx @typescript/native-preview` instead of `tsc` — it's the Go-based TypeScript checker, orders of magnitude faster.

## UI Design System — Industrial Brutalist

**This section is MANDATORY. All UI changes MUST comply with these rules. Do not deviate.**

### Design Philosophy

The UI follows an **Industrial Brutalist** aesthetic: utilitarian, geometric, high-contrast, zero ornamentation. Every element is a rectangle. Borders are structural, not decorative. Typography is the primary visual tool. The interface should feel like a terminal crossed with a Swiss design poster — engineered, not styled.

### Core Rules

#### 1. ZERO Border Radius — No Exceptions

- `border-radius: 0` is enforced globally via `* { border-radius: 0 !important; }` in `globals.css`
- NEVER add `rounded-*` classes to any element. They are neutralized but the intent matters — do not write them.
- Buttons, inputs, cards, modals, chips, badges — all rectangles. No pills, no circles, no soft corners.
- If a new library or component introduces rounded corners, override them to 0.

#### 2. Border Weight Hierarchy

Borders communicate structure, not decoration. Use this hierarchy consistently:

| Border | Usage |
|--------|-------|
| `border-2` (2px) | Structural boundaries: header bottom, input area top, sidebar edge, toolbar top, section dividers |
| `border` (1px) | Content-level separators: message dividers, code block borders, table cells |
| `border-l-2` | State indicators: active sidebar item, streaming indicator, status stripe on header |
| `border-dashed` | Empty/placeholder states only (e.g., "new session" button, empty workspace) |

NEVER use `border-0` on structural elements. NEVER use subtle `border-foreground/[0.04]` — minimum opacity for visible borders is `0.08`.

#### 3. Typography

**Fonts:**
- Body: `Instrument Sans` — geometric, clean, no-nonsense
- Mono: `JetBrains Mono` — blocky, developer-oriented, excellent at small sizes

**Rules:**
- Labels and metadata: `text-[10px] font-mono font-bold uppercase tracking-[0.15em]` — this is the signature label style. Use it for: section headers, message role labels ("YOU", "CLAUDE"), status text, category labels.
- Body text: `text-sm` with `font-[inherit]` (Instrument Sans)
- Code/technical values: `font-mono` always
- NEVER use title case for labels. Use UPPERCASE for labels, sentence case for content.
- Font weights: use `font-bold` or `font-semibold` for emphasis. Avoid `font-light` or `font-normal` on labels.

#### 4. Color System

Minimal palette. Color communicates function, not mood.

| Token | Value | Usage |
|-------|-------|-------|
| `foreground` | `#0a0a0a` | Primary text, solid buttons, Claude avatar bg |
| `background` | `#fafafa` | Page bg, input bg (transparent over this) |
| `foreground/[0.08]` | — | Structural borders |
| `foreground/[0.30-0.50]` | — | Secondary/muted text |
| `emerald-500/600/700` | — | Connected/success states ONLY |
| `red-500/600` | — | Error/destructive states ONLY |
| `amber-500/600/700` | — | Warnings, permission prompts, tool use indicators ONLY |
| `blue-500/600` | — | Questions/information prompts ONLY |

**Rules:**
- NEVER use gradients on backgrounds or buttons. Gradients are allowed ONLY for scroll-overflow fade indicators on the QuickActions toolbar.
- NEVER use `bg-blue-*`, `bg-purple-*`, or any saturated background for sections or cards. Colored backgrounds are reserved for status indicators at very low opacity (e.g., `bg-amber-50/30`).
- Solid colored squares (e.g., `bg-amber-500`, `bg-blue-600`, `bg-foreground`) are used for icon badges. They must be squares, not circles.

#### 5. Spacing & Layout

- **Touch targets:** minimum `44px` (`min-h-[44px]` / `min-w-[44px]`) on all interactive elements. This is an accessibility requirement — do not reduce.
- **Content max-width:** `max-w-2xl mx-auto` for message area and input. Do not change.
- **Input area:** textarea has NO visible border. It sits on transparent bg. The `border-t-2` on the container is the visual boundary. Send button is a solid `bg-foreground` rectangle flush to the edge.
- **Flush elements:** buttons and action areas should use `gap-0` when abutting each other (e.g., DENY/ALLOW buttons). Gaps between structural sections, not between action siblings.
- **Mobile-first padding:** use `p-4 sm:p-6` pattern. Mobile gets tighter spacing.

#### 6. QuickActions Toolbar (above input)

This is the dynamic action bar. Design rules:

- **Tab-like chips**, not pills. No border-radius, separated by `border-right: 1px solid`.
- **Horizontal scroll** with momentum (`-webkit-overflow-scrolling: touch`) and hidden scrollbar.
- **Scroll overflow indicators:** gradient fade + chevron arrow buttons on left/right edges. These appear/disappear dynamically based on scroll position using `ResizeObserver` + scroll listeners.
- **Chip types:** preset (amber tint), command (neutral), hint (italic, muted). Each has distinct but subtle visual treatment.
- **Compact height:** `min-height: 40px` per chip. Must remain single-line.

#### 7. Interactive States

| State | Treatment |
|-------|-----------|
| Hover | `bg-foreground/[0.04-0.06]` — subtle background shift |
| Active/Press | `bg-foreground/[0.08-0.10]` — slightly deeper |
| Disabled | `opacity-10` to `opacity-30` — ghosted out |
| Selected | `border-foreground` (2px) + `bg-foreground/[0.05]` — structural highlight, not color fill |
| Focus | `focus:outline-none` on inputs (border-based focus instead). Use `focus:border-foreground/30` when needed. |

NEVER use `scale-95` / `scale-97` for press states. NEVER use `shadow-*` for elevation. This is a flat design — no depth simulation.

#### 8. Icon Treatment

- Icons are from `lucide-react` exclusively
- Standard size: `w-3 h-3` for inline/small, `w-3.5 h-3.5` for buttons, `w-4 h-4` for navigation
- Icon badges (role avatars, status icons): solid colored square with white icon inside. e.g., `w-5 h-5 bg-foreground flex items-center justify-center` with `w-3 h-3 text-background` icon.
- NEVER wrap icons in circles (`rounded-full`). Always squares.

#### 9. What NOT to Do

These are anti-patterns. If you find yourself writing any of these, stop and reconsider:

- `rounded-*` anything — no rounded corners, ever
- `shadow-*` anything — no box shadows, no elevation
- `backdrop-blur-*` on overlays — use solid `bg-black/60` instead
- `bg-gradient-*` on buttons or cards — no gradients except scroll fades
- `border-foreground/[0.04]` or lower — too subtle, invisible on screens. Minimum `0.06`.
- `text-blue-500` as link color — links are `#0a0a0a` with `border-bottom: 2px solid`
- `animate-bounce`, `animate-pulse` — no playful animations. Only `animate-spin` for loading.
- Generic sans-serif fonts (Inter, Arial, Roboto, system-ui as primary) — use Instrument Sans
- Pill-shaped anything (`rounded-full`) — this directly violates rule 1
- Color-filled buttons other than `bg-foreground` for primary actions — no blue/green/purple CTA buttons
- Adding comments, emojis, or decorative elements to the UI

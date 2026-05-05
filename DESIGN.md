---
name: Action Development
description: Dark-premium digital agency web — typographic restraint, electric lime accent, immersive 3D hero
colors:
  background: "#080808"
  foreground: "#ededed"
  accent: "#c8ff00"
  muted: "#767676"
  border: "#1c1c1c"
  card: "#0f0f0f"
  card-hover: "#141414"
typography:
  display:
    fontFamily: "Syne, sans-serif"
    fontSize: "clamp(2.75rem, 8vw, 7rem)"
    fontWeight: 700
    lineHeight: 0.94
    letterSpacing: "-0.04em"
  display-l:
    fontFamily: "Syne, sans-serif"
    fontSize: "clamp(2rem, 5.5vw, 5rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  display-m:
    fontFamily: "Syne, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "-0.005em"
  label:
    fontFamily: "Geist Mono, monospace"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.18em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "16px"
  pill: "9999px"
spacing:
  section-py: "clamp(6rem, 14vh, 12rem)"
  container-max: "1200px"
  container-px: "clamp(1.5rem, 5vw, 3rem)"
components:
  nav-link:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "0"
    padding: "8px 0"
  nav-link-active:
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "0"
    padding: "8px 0"
  button-cta:
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "0"
    padding: "8px 0"
  input-field:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "0"
    padding: "12px 0"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: "24px"
  card-hover:
    backgroundColor: "{colors.card-hover}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: "24px"
---

# Design System: Action Development

## 1. Overview

**Creative North Star: "The Electric Proof"**

Action's design system doesn't describe capability — it demonstrates it. Every typographic choice, every motion curve, every pixel of restraint is itself an argument: *this is what we build*. The near-black canvas (`#080808`) creates a stage where the electric lime (`#c8ff00`) accent lands with surgical precision. There are no gradients, no shadows, no decorative elements that don't earn their place. The system proves taste through what it refuses.

The typography stack is a three-tier instrument: Syne Bold for display (tight tracking, compressed leading, authority), Geist Sans for body (neutral, readable, invisible), and Geist Mono for labels and accents (technical, precise, honest). These three never blur into each other — contrast between roles is the hierarchy.

This system explicitly rejects: AI-generated aesthetics (glassmorphism, gradient text, dark glows, identical card grids), agencia cutre patterns (stock imagery, saturated multi-color palettes, heavy shadows), and SaaS template defaults (blue primary + white, hero metric layouts, "trusted by 500+ companies"). The target audience is a business decision-maker evaluating trust — not a developer appreciating cleverness.

**Key Characteristics:**
- Dark-first, single accent color used in ≤3 moments per page
- Hairlines replace shadows — depth through opacity, not blur
- Motion is one curve (`cubic-bezier(0.16, 1, 0.3, 1)`), two durations
- Typography carries interaction vocabulary (underline scale-x, ↗ arrow)
- Film grain at 3.2% opacity prevents the flat-dark-UI look

## 2. Colors: The Restrained Voltage Palette

A near-monochrome system with one moment of voltage. The lime exists because everything else refused color.

### Primary
- **Electric Lime** (`#c8ff00`): The single accent. Availability pulse dot in nav, active state underlines, AccentWord highlights, progress fills, focus rings. Never decorative — always functional or semantic. Used ≤3 times per viewport.

### Neutral
- **Stage Black** (`#080808`): Page background. Not pure black — the 8/8/8 tint prevents harsh contrast. Film grain rendered on top.
- **Editorial White** (`#ededed`): Body text and foreground. Warm enough to avoid clinical brightness on stage black.
- **Surface Low** (`#0f0f0f`): Card backgrounds. One step above stage black.
- **Surface Hover** (`#141414`): Card hover state. Two steps above stage black.
- **Structural Grey** (`#767676`): Muted text, labels, secondary information. Passes WCAG AA on stage black (4.6:1).
- **Hairline** (`rgba(237,237,237,0.06)`): Dividers, panel borders. Near-invisible depth.
- **Hairline Strong** (`rgba(237,237,237,0.12)`): Progress bars, stronger dividers. Still whisper-level.
- **Border** (`#1c1c1c`): Section borders, explicit separators.

### Named Rules
**The One Voice Rule.** Electric Lime appears on ≤3 elements per viewport. Its rarity is the point — every additional use dilutes the signal. When in doubt, remove it.

**The No-Shadow Rule.** Shadows are defined in tokens but never used in components. Depth is expressed through surface layering (`card` → `card-hover`), hairlines, and opacity. If you're reaching for `box-shadow`, reconsider the structure.

**The Tint Rule.** Never use pure `#000000` or `#ffffff`. Background is `#080808`, foreground is `#ededed`. The tint keeps the system from feeling clinical.

## 3. Typography

**Display Font:** Syne (700) — bold, geometric, compressed  
**Body Font:** Geist Sans (400/500) — neutral, variable, invisible  
**Label/Mono Font:** Geist Mono (500) — technical, monospaced, precise

**Character:** Three distinct voices in controlled counterpoint. Syne announces; Geist Sans narrates; Geist Mono labels and punctuates. The system's personality lives in the contrast between them — never let the roles blur.

### Hierarchy
- **Display XL** (Syne 700, `clamp(2.75rem, 8vw, 7rem)`, LH 0.94, LS -0.04em): Hero headlines only. Tight enough to feel like a wordmark at large sizes.
- **Display L** (Syne 700, `clamp(2rem, 5.5vw, 5rem)`, LH 0.98, LS -0.035em): Section headlines. Same compression, smaller stage.
- **Display M** (Syne 700, `clamp(1.5rem, 3vw, 2.5rem)`, LH 1.08, LS -0.025em): Sub-headlines, card titles.
- **Lede** (Geist Sans 400, `clamp(1rem, 1.4vw, 1.2rem)`, LH 1.55, max-w 52ch): Subtitle copy beneath headlines. Color-mixed to 72% foreground opacity.
- **Body** (Geist Sans 400, 17px, LH 1.55, LS -0.005em): General prose. Max 62ch for readability.
- **Label / Micro** (Geist Mono 500, 11px, uppercase, LS 0.18em): Section labels, nav items, progress indicators, data annotations. Always uppercase, always mono, always muted unless active.
- **Accent Word** (Geist Mono 500, 0.78em relative, uppercase, LS 0.02em, color: accent): Inline highlight in display headlines. Replaces italic/gradient emphasis with font-family contrast.

### Named Rules
**The Three-Voice Rule.** Every text element belongs to exactly one voice: Syne (headline), Geist Sans (prose), or Geist Mono (label/data). Mixing roles within a single text block is prohibited.

**The Tracking Inversion Rule.** Display type tracks tight (−0.04em to −0.025em). Label type tracks wide (+0.18em to +0.28em). Body type is near-zero. Inverting this breaks the hierarchy.

## 4. Elevation

This system is **flat by design**. There are no `box-shadow` values applied to any component in production — the token exists as a reserved primitive, not an active tool.

Depth is conveyed through:
1. **Surface layering** — `background` (#080808) → `card` (#0f0f0f) → `card-hover` (#141414). Three levels, no blur.
2. **Hairlines** — `rgba(237,237,237,0.06)` for ambient separation, `0.12` for structural. Never colored.
3. **Opacity** — `foreground/65`, `foreground/30`, `foreground/[0.12]` for typographic depth without color.
4. **Film grain** — `body::before` at `opacity: 0.032`, `mix-blend-mode: overlay`. Prevents the flat-dark-UI look without adding light-source illusions.

### Named Rules
**The Flat-by-Default Rule.** Surfaces are flat at rest. Elevation is expressed through color steps, never shadows. If a shadow seems necessary, the structure probably needs rethinking.

## 5. Components

### Navigation
Editorial, typographic — not a UI bar. Mono 11px uppercase, 0.28em tracking. Links default to `muted` (#767676), transition to `foreground` on hover/active. Active state: Electric Lime underline (`h-px origin-left scale-x-100`), default state: `scale-x-0 group-hover:scale-x-100`. The underline is the only interactive feedback — no background fills, no borders.

- **Logo:** 32px height, `invert opacity-70`, `group-hover:opacity-100`
- **CTA "Let's talk":** Same mono vocabulary + availability pulse dot (Electric Lime, `animate-ping`) + `↗` arrow that translates on hover
- **Language toggle:** `ES | EN`, same mono style, inactive = muted

### Inputs / Form Fields
Editorial baseline style — no boxes, no backgrounds. Bottom border only (`border-b border-[var(--hairline-strong)]`). Focus shifts border to `accent` (#c8ff00). Labels above each field in `micro-label` class (Geist Mono, 11px, 50% opacity).

- **Textarea:** Same baseline style, `resize-none`
- **Error state:** Not yet implemented — should use `border-b border-red-500/70` with inline `micro-label` error below field
- **Placeholder:** `text-muted/50`

### Submit / CTA Buttons
Typographic — not button-shaped. Mono 11-12px uppercase. Underline as default state (inverted from nav — present at rest, disappears on hover). `↗` arrow translates right on hover. No background, no border, no radius.

### Cards (Project Cards)
`bg-card` (#0f0f0f), `border border-[var(--hairline)]`, `rounded-[4px]`. Hover to `bg-card-hover` (#141414). No shadows. Transition via `--ease` at `--duration`.

### Signature: AccentWord
`<span>` with `font-mono font-medium text-[0.78em] uppercase tracking-[0.02em] text-accent vertical-align-[0.05em]`. Used inline within display headlines to introduce a secondary word without gradient text. One per headline maximum.

### Signature: Micro-label
`font-mono font-medium text-[11px] uppercase tracking-[0.18em] text-muted`. The connective tissue of the system — section labels, nav items, progress counts, data annotations. Always the same style, always muted unless overridden.

## 6. Do's and Don'ts

### Do:
- **Do** use `#080808` as background — never `#000000`. The 8-unit tint prevents harshness.
- **Do** apply Electric Lime (`#c8ff00`) in ≤3 elements per viewport. Availability dot, active state, one CTA signal.
- **Do** express depth through surface layering and hairlines (`rgba(237,237,237,0.06-0.12)`), never shadows.
- **Do** use Geist Mono for all labels, data, nav items, and inline accent words — never for body text.
- **Do** use `cubic-bezier(0.16, 1, 0.3, 1)` as the single motion curve. `180ms` for micro-interactions, `320ms` for transitions, `600ms` for reveals.
- **Do** apply `focus:border-accent` on all interactive elements — Electric Lime focus ring is the accessible signal.
- **Do** use `::selection { background: var(--accent); color: var(--background); }` — it's already set globally.
- **Do** use `clamp()` for all display type sizes — fixed px values break the fluid scale.

### Don't:
- **Don't** use `background-clip: text` with any gradient — gradient text is prohibited. Use `AccentWord` for emphasis.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe. Never.
- **Don't** use `backdrop-filter: blur()` decoratively. Only functional chrome (nav over canvas, modal overlays).
- **Don't** use `box-shadow` with color on any component. Shadows are reserved as tokens, not active design elements.
- **Don't** use more than 3 font families. Syne + Geist Sans + Geist Mono — nothing else.
- **Don't** introduce colors beyond the token system. No arbitrary hex values in component files.
- **Don't** use stock imagery or placeholder gradient fills as content. Use `bg-border` divs until real assets exist.
- **Don't** design hero metric layouts (big number + small label + stats). This is the SaaS template cliché.
- **Don't** use identical card grids (icon + heading + text repeated). Every card must have a reason to exist at that size.
- **Don't** let AI-generated aesthetics through: no glassmorphism, no dark glows, no neon-on-black, no saturated multi-color palettes.
- **Don't** use `!important` except for Lenis smooth-scroll and `prefers-reduced-motion` overrides — those are the two sanctioned exceptions in `globals.css`.
- **Don't** add `rounded-xl`, `rounded-2xl`, or `rounded-3xl` — the radius scale collapses to 16px at `lg`. Nothing rounder than 16px is on-brand.

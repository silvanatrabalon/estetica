---
name: Estética So Beauty
description: A calm spa treatment menu for the day, in sage, lilac and peach with plum ink.
colors:
  plum: "#5b3f73"
  plum-strong: "#46305b"
  sage: "#dce8dc"
  sage-ground: "#f4f7f3"
  sage-rule: "#d9e3d6"
  paper: "#ffffff"
  lilac-wash: "#ede8f5"
  lilac: "#e6dff1"
  peach: "#fbe3d6"
  peach-ink: "#8a3f14"
  ink: "#3b2a4a"
  ink-soft: "#6c5b7b"
  state-confirmed: "#7fae8f"
  state-pending: "#efb392"
  state-cancelled: "#e08a8a"
  state-completed: "#9c86b8"
typography:
  display:
    fontFamily: "Nunito Sans, Avenir Next, Avenir, Segoe UI, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Nunito Sans, Avenir Next, Avenir, Segoe UI, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.75rem
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Nunito Sans, Avenir Next, Avenir, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.375
  body:
    fontFamily: "Nunito Sans, SF Pro Text, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.375
  label:
    fontFamily: "Nunito Sans, SF Pro Text, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1rem
    letterSpacing: "0em"
rounded:
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  shell-mobile: "16px"
  shell-desktop: "24px"
  card: "20px"
  card-wide: "24px"
  gap: "24px"
components:
  next-turn-card:
    backgroundColor: "{colors.lilac}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "20px"
  agenda-list:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
  agenda-row-next:
    backgroundColor: "{colors.lilac}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
    height: "64px"
  status-pill:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  status-pill-pending:
    backgroundColor: "{colors.peach}"
    textColor: "{colors.peach-ink}"
  nav-link:
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
    height: "44px"
  nav-link-active:
    backgroundColor: "{colors.lilac}"
    textColor: "{colors.ink}"
  mobile-tab-active-indicator:
    backgroundColor: "{colors.lilac}"
    rounded: "{rounded.full}"
    width: "56px"
    height: "32px"
  stat-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  top-bar:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.ink}"
    height: "64px"
---

# Design System: Estética So Beauty

## Overview

**Creative North Star: "Carta de spa"**

The admin reads like a calm spa treatment menu for the day: what is next, then the day in time order, then the month. Soft sage, lilac and peach surfaces carry the structure; plum ink carries the text and the actions. The warmth of the voice (Rioplatense Spanish, "vos") is matched by large rounded cards, one humane typeface and no chrome.

Density is low and phone-first. Every screen is designed at phone width first and then opens into two columns on desktop. Depth comes from tone and thin sage rules, not from shadows. State is told with pastel pills and dots, never with saturated alarms.

The previous teal and orange look with Space Grotesk and Manrope is retired. The name "Estética So Beauty" and its logo are the only inherited identity.

**Key Characteristics:**
- Pastel sage ground, white cards, lilac for "this one, now", peach for "waiting".
- One family, Nunito Sans, from weight 400 to 800; heavy weights carry hierarchy so size can stay modest.
- Cards at 24px radius, no shadows at rest, thin sage borders.
- Time is the hero: clock times set at weight 800 with tabular numerals.
- Touch targets of at least 44px (nav links) and 64px (agenda rows, tab bar).

## Colors

A pale sage ground with plum ink; lilac and peach are soft signals, sage is the structural band.

### Primary
- **Plum** (#5b3f73): primary actions and the focus ring (3px outline, 2px offset). Hover and pressed deepen to **Deep Plum** (#46305b).

### Secondary
- **Sage Band** (#dce8dc): top bar, neutral status pills, the "En vivo" chip. Defined as `brand.secondary`.
- **Lilac** (#e6dff1): the one highlighted thing: the next-turn card, the next row in the list, the active nav link, the active phone tab indicator.

### Tertiary
- **Peach** (#fbe3d6) with **Peach Ink** (#8a3f14): pending states and the money stat. Text on peach is always peach ink, never plum.

### Neutral
- **Sage Ground** (#f4f7f3): page background.
- **Paper** (#ffffff): cards, agenda list, side menu, bottom bar.
- **Lilac Wash** (#ede8f5): quiet fills: skeletons, hover on nav, empty-state card.
- **Plum Ink** (#3b2a4a): primary text. **Soft Plum** (#6c5b7b): secondary text and inactive nav.
- **Sage Rule** (#d9e3d6): every border and row divider.
- **State dots and bars:** confirmed (#7fae8f), pending (#efb392), cancelled (#e08a8a), completed (#9c86b8). Used only for the status dots and breakdown bars, not as text colors.

### Named Rules
**The One Lilac Rule.** Lilac marks the single current thing in a view (next turn, current page). If three things are lilac, none of them is.

**The Peach Ink Rule.** Peach is only legible with its own ink (#8a3f14). Never put plum or gray text on peach.

## Typography

**Display Font:** Nunito Sans (with Avenir Next, Avenir, Segoe UI, sans-serif)
**Body Font:** Nunito Sans (with SF Pro Text, Segoe UI, -apple-system, sans-serif)

**Character:** Rounded, friendly and highly legible; weight, not a second family, makes the hierarchy. Headings use -0.02em tracking.

### Hierarchy
- **Display** (800, 3.75rem / 60px, line-height 1): the next turn's clock time, tabular numerals.
- **Headline** (800, 1.25rem rising to 1.5rem at sm, tight tracking): page title and section headings ("Próximo turno", "Hoy · N turnos"; sentence case, no uppercase kickers).
- **Title** (600, 1rem, snug): client name in agenda rows. Row time is 800 at 1.125rem.
- **Body** (400, 0.875rem to 1rem): service names, descriptions, secondary text in Soft Plum.
- **Label** (700, 0.75rem): pills, tab-bar labels and the "En vivo" chip. Sentence case, no tracking.

### Named Rules
**The Weight Does the Work Rule.** Raise weight (600 to 800) before raising size; stay inside Nunito Sans.

**The Clock Rule.** Any time of day is weight 800 with tabular numerals.

## Layout

Phone first. The shell is a single column with a 64px sage top bar, 16px content padding (24px from 768px) and 80px of bottom padding so the fixed bottom bar never hides the last row. At md (768px) the shell becomes a 250px side menu plus content, the bottom bar disappears and the hamburger hides.

On phones the order is top bar, page header, "Próximo turno" card, "Hoy" list, month stat cards, status breakdown, bottom bar (Inicio, Turnos, Calendario, Más). "Más" opens the full menu as a drawer from the left, under the top bar, with a dimmed backdrop.

At lg the Inicio screen is two columns, `minmax(0,1.15fr)` for next turn and the day list and `minmax(0,1fr)` for the month, with a 24px gap inside a max-width of 72rem (6xl). Month stats sit in a two-column grid with 12px gaps. Sections are spaced 24px apart. Agenda rows are a 3.5rem time column plus content on phones, with the state pill under the client; from sm the pill moves to the right edge.

## Elevation & Depth

Flat by default. Cards separate from the sage ground through white or lilac fills and 1px sage rules; list rows use sage dividers. No shadow appears at rest. The one shadow is the mobile drawer, `0 10px 30px -14px rgba(15, 23, 42, 0.24)`, removed from md up. The loading skeleton pulses on Lilac Wash.

### Named Rules
**The No-Shadow Rule.** Cards never carry shadows; separation is tone plus a Sage Rule.

## Shapes

Large and soft. Page cards and the agenda list use 24px radius (rounded-3xl); stat cards and highlighted rows 16px; nav links and icon buttons 12px; pills, the tab indicator and the status dots are fully round. The next row in the list bleeds 16px past the list's inner padding so its lilac reaches the card edge. Borders are 1px Sage Rule.

## Components

### Next-turn card
Lilac, 24px radius, 20px padding (24px from sm). Clock time at Display, client name in Headline, then "service · con professional" in Soft Plum. Empty state swaps to Lilac Wash with "Hoy no tenés turnos." or "No quedan turnos por hoy." and a one-line explanation.

### Agenda list
White card, 24px radius, sage border, dividers between rows, minimum row height 64px. Row: time (800), client (600) over service (Soft Plum), state pill. The next row is lilac with `aria-current`. Completed rows drop to 60% opacity.

### Status pill
Full radius, 4px by 10px, 700 at 0.75rem. Pending uses peach with peach ink; every other state uses the sage band with plum ink. The label is always text ("Pendiente", "Confirmado"), never color alone.

### Navigation
Top bar: sage, 64px, a 1px sage rule below, brand name in semibold, hamburger visible below md. Side menu: white, nav links 44px tall, 12px radius, Soft Plum text at 500; hover fills Lilac Wash with a 1.01 scale; active is lilac with plum ink at 600 and `aria-current="page"`. Phone bottom bar: white, 1px top rule, 64px tall items, 22px stroke icons at 2px width, 12px labels at 700; active shows a 56 by 32px lilac pill behind the icon and plum ink text. "Más" opens the drawer and shows the same lilac pill while open.

### Stat card
White, 16px radius, sage border, 16px padding; an icon chip (Lilac Wash with plum, or peach with peach ink for money), then label and value. Light variant only is in the new world.

### Analytics panel
White card, 24px radius, 20px padding; a total, then one row per state with a dot, count, percentage and a bar in the state color. The bar animates width in 700ms on the standard ease.

### Motion
One ease, `cubic-bezier(0.22, 1, 0.36, 1)`. Structural moves (drawer) 300ms; overlays and micro-interactions 200ms. The "En vivo" dot pulses.

## Do's and Don'ts

### Do:
- **Do** use Nunito Sans only, and build hierarchy with weight 400, 600 and 800.
- **Do** keep cards flat with 24px radius and a 1px Sage Rule.
- **Do** put the single current item in lilac and pending items in peach with peach ink.
- **Do** write copy in Rioplatense "vos" ("Hoy no tenés turnos.").
- **Do** keep touch targets at 44px or more and agenda rows at 64px.
- **Do** read all colors from the CSS variables, not literals.

### Don't:
- **Don't** reintroduce the old teal, emerald or orange accents, Space Grotesk or Manrope.
- **Don't** open a screen with a grid of equal statistic tiles; lead with the next thing to do.
- **Don't** add shadows to cards.
- **Don't** use color alone for state; keep the text pill.
- **Don't** use plum or gray text on peach.
- **Don't** copy the Inicio screen's composition onto other screens; carry the tokens and forms, not the layout.

### Known drift (recorded, not canonized)
- Roughly 40 files outside Inicio and the shell still use hard-coded Tailwind teal, emerald and gray classes (appointments, booking, availability, landing, sign-in, staff, users, legal, modals, Select and Listbox).
- On Inicio itself, the analytics panel (heading, preset toggle, total, rows, skeletons) and the StatCard label and value still use gray-400 to gray-900; the toggle uses a small shadow. The error banners use red-50, red-200 and red-700.
- StatCard keeps a dark variant with teal-tinted literals (#14211f, #1e3532, #e2f5f1, #9ec6bf) and the `--color-dark-*` variables are legacy teal-black.
- The side menu is white, not a sage rail as the direction contract described; only the top bar is sage.
- The mobile drawer backdrop is slate (`slate-900/45`), outside the palette.

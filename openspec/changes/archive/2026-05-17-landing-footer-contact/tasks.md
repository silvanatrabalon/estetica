## 1. Icons

- [x] 1.1 In `LandingPage.tsx` (or a co-located file), create an `InstagramIcon` presentational component with the Instagram SVG path; `aria-hidden="true"` on the SVG
- [x] 1.2 In `LandingPage.tsx` (or a co-located file), create a `WhatsAppIcon` presentational component with the WhatsApp SVG path; `aria-hidden="true"` on the SVG

## 2. Footer Update

- [x] 2.1 Replace the existing Instagram text link with an `<a>` using `InstagramIcon`; add `aria-label="Instagram"` to the `<a>`; keep the existing href
- [x] 2.2 Add a WhatsApp CTA: `<a href="https://w.app/bfs0ip" target="_blank" rel="noopener noreferrer">` containing `<WhatsAppIcon />` and the label "Escribinos por WhatsApp"; style as a button or prominent link
- [x] 2.3 Update copyright line to `© 2026 Software Queen` where "Software Queen" is `<a href="mailto:silvana.trabalon@gmail.com">Software Queen</a>`

## 3. Verification

- [x] 3.1 Run `npx tsc --noEmit` — no TypeScript errors
- [x] 3.2 Run `npx vitest run` — existing tests still pass
- [x] 3.3 Visually verify footer on mobile and desktop viewports

## Context

The footer currently contains plain-text anchor elements for Instagram and WhatsApp, plus a bare copyright line. The design goal is to make social links immediately recognizable via their brand icons and to surface a clear WhatsApp CTA so customers can contact the studio in one tap.

## Goals / Non-Goals

**Goals:**
- Replace the Instagram text link with the Instagram SVG icon (accessible with `aria-label`).
- Add a WhatsApp CTA button with the WhatsApp logo + label "Escribinos por WhatsApp", fixed URL `https://w.app/bfs0ip`.
- Update copyright line to `© 2026 Software Queen` where "Software Queen" is a `mailto:` link.

**Non-Goals:**
- Adding any other social networks.
- Changing footer layout or overall page structure.
- Using an icon library npm package — inline SVG is sufficient and zero-dependency.
- A/B testing or analytics on CTA clicks.

## Decisions

### 1. Inline SVG for icons (no npm dependency)
Instagram and WhatsApp SVG paths are stable, small, and freely available under their respective brand guidelines for linking purposes. Inlining them avoids a new dependency and a network request. The SVG code will be extracted into small presentational components (`InstagramIcon`, `WhatsAppIcon`) local to the footer section of `LandingPage.tsx`.

### 2. Fixed WhatsApp URL (`https://w.app/bfs0ip`)
The client provides this short link. The `wa.me` dynamic constructor was explicitly excluded. The URL is hardcoded — it is not an environment variable (it's a public-facing contact link, not a secret).

### 3. Copyright as `mailto:` link
Linking "Software Queen" to `silvana.trabalon@gmail.com` via `mailto:` is the simplest approach that requires no routing or new page. It opens the visitor's default mail client, consistent with a personal studio website.

### 4. Accessibility
- Instagram icon link: `aria-label="Instagram"` on the `<a>` element; `aria-hidden="true"` on the SVG.
- WhatsApp button: the label "Escribinos por WhatsApp" is visible text, so no additional ARIA needed.
- Copyright link: visible text, no ARIA needed.

## Risks / Trade-offs

- [Minor] SVG brand marks must be used according to each platform's brand guidelines. Linking to the official profile (Instagram) and contact shortlink (WhatsApp) is an accepted use case.
- [Minor] `mailto:` links do not work if the user has no default email client configured; this is an acceptable limitation for a studio website.

## Why

The landing page footer currently shows plain-text links for Instagram and WhatsApp, with a generic copyright line. This is a missed branding opportunity and makes the social/contact section look unfinished. Customers are more likely to tap a recognizable brand icon than a bare URL, and the WhatsApp contact should be a clearly labeled CTA. The copyright should also reflect the studio's developer ("Software Queen").

## What Changes

- **Instagram**: Replace the current text link with an inline Instagram SVG logo icon (no new npm dependency — inline SVG preferred). Link text removed; icon links to the existing Instagram URL.
- **WhatsApp**: Add a WhatsApp logo icon + CTA button labeled "Escribinos por WhatsApp" linking to the fixed URL `https://w.app/bfs0ip`. The `wa.me` dynamic constructor must NOT be used.
- **Copyright**: Update line to `© 2026 Software Queen` where "Software Queen" is a `<a href="mailto:silvana.trabalon@gmail.com">Software Queen</a>` link.

## Capabilities

### New Capabilities
- `landing-footer-contact`: Footer contact section with Instagram icon link, WhatsApp CTA button with logo, and updated copyright with mailto link.

### Modified Capabilities
- `public-landing-page`: Footer section visual and copy changes — social links become icon-based; copyright updated.

## Impact

- `src/pages/LandingPage.tsx` — footer JSX update; inline SVG icons for Instagram and WhatsApp
- No new dependencies required
- No backend or DB changes

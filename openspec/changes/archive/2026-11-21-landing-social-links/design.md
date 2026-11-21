## Decisions

- **Own table instead of columns on `landing_config`**: networks can be added without changing RPC return shapes; plain table access with RLS avoids rewriting the landing RPCs.
- **`enabled` per row**: lets the admin keep a link stored but hidden. RLS hides disabled rows from non-admins, so the public query never needs to filter client-side for safety (it still filters for clarity).
- **Validation in `src/lib/socialLinks.ts`** shared by the editor, the service (before any write) and the footer (`buildSocialHref` returns null for unsafe values, so a bad stored value is never rendered as a link).
- **Editor placed in Página pública** (not Negocio): the links only affect the public page.
- **WhatsApp as number**: the app builds `https://wa.me/<digits>`; the previous hardcoded `w.app` link was removed, so WhatsApp reappears once the number is saved.

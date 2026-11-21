## 1. Database

- [x] 1.1 Migration `20260521300000_social_links.sql`: table, network check, RLS policies, grants
- [x] 1.2 Copy existing `landing_config.instagram_url` into `social_links`
- [x] 1.3 Apply to production and verify anon can read (200) and cannot write (401)

## 2. Logic and service

- [x] 2.1 `src/lib/socialLinks.ts`: networks, normalize, validate, build href
- [x] 2.2 `src/services/socialLinks.ts`: public read, admin read, save (upsert + delete empty)

## 3. UI

- [x] 3.1 `SocialLinksEditor` section in Página pública with "Mostrar" check per network
- [x] 3.2 `SocialLinksList` in the landing footer; remove hardcoded WhatsApp and old Instagram link
- [x] 3.3 Remove Instagram field from the landing config form

## 4. Tests

- [x] 4.1 Validation and href tests, including unsafe URLs and WhatsApp digit boundaries
- [x] 4.2 Service tests: validate before write, upsert and delete, ordering, unknown networks
- [x] 4.3 Editor and footer component tests

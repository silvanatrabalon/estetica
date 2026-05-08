# Setup Checklist

Everything needed before starting to build features.

---

## 1. GitHub

- [ ] Create repository
- [ ] Push this template to it

---

## 2. Supabase

- [ ] Create account at supabase.com
- [ ] Create new project (note region, use one close to your users)
- [ ] Go to **Project Settings → API** and copy:
  - `Project URL` → `VITE_SUPABASE_URL`
  - `anon public` key → `VITE_SUPABASE_ANON_KEY`
- [ ] Enable Google OAuth:
  - Go to **Authentication → Providers → Google**
  - Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com) (OAuth 2.0 Client ID)
  - Paste Client ID and Secret into Supabase
  - Add redirect URL: `https://<your-vercel-domain>/auth/callback`
  - Add `http://localhost:5173/auth/callback` for local dev

---

## 3. Vercel

- [ ] Create account at vercel.com
- [ ] Import the GitHub repository
- [ ] Set environment variables in **Project Settings → Environment Variables**:
  ```
  VITE_SUPABASE_URL=
  VITE_SUPABASE_ANON_KEY=
  ```
- [ ] Deploy — Vercel auto-deploys on every push to `main`

---

## 4. Resend (only when email is needed)

- [ ] Create account at resend.com
- [ ] Verify your sending domain
- [ ] Create API key → `RESEND_API_KEY`
- [ ] Add to Vercel environment variables (server-side only, never expose to frontend)

---

## 5. Local development

Create `.env.local` at the project root (never commit this file):

```bash
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Done

Once these steps are complete, the infrastructure is ready and you can start creating features via OpenSpec.

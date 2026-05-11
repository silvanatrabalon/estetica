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
---

## 3. Google OAuth

- [ ] Go to [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services → Credentials**
- [ ] **Create Credentials → OAuth 2.0 Client ID** (type: Web application)
- [ ] In *Authorized JavaScript origins* add: `https://<your-project>.supabase.co` (domain only, no path)
- [ ] In *Authorized redirect URIs* add: `https://<your-project>.supabase.co/auth/v1/callback`
- [ ] Copy the **Client ID** and **Client Secret**
- [ ] Go to `https://supabase.com/dashboard/project/<your-project-ref>/auth/providers?provider=Google`
- [ ] Paste Client ID and Client Secret and enable

---

## 4. Vercel

- [ ] Create account at vercel.com
- [ ] Import the GitHub repository
- [ ] Set environment variables in **Project Settings → Environment Variables**:
  ```
  VITE_SUPABASE_URL=
  VITE_SUPABASE_ANON_KEY=
  ```
- [ ] Deploy — Vercel auto-deploys on every push to `main`

---

## 5. Resend (only when email is needed)

- [ ] Create account at resend.com
- [ ] Verify your sending domain
- [ ] Create API key → `RESEND_API_KEY`
- [ ] Add to Vercel environment variables (server-side only, never expose to frontend)

---

## 6. Local development

Create `.env.local` at the project root (never commit this file):

```bash
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Done

Once these steps are complete, the infrastructure is ready and you can start creating features via OpenSpec.

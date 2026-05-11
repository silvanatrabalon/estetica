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

## 6. Local development setup

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org/))
- npm or yarn

### Bootstrap Steps (clean clone)

1. **Install dependencies**

   ```bash
   npm install
   ```

   This installs all project dependencies: React, Vite, TypeScript, TailwindCSS, Supabase client, and dev tools.

2. **Configure environment**

   Create `.env.local` at the project root (never commit this file):

   ```bash
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   Get these values from your Supabase project:
   - Go to **Project Settings → API**
   - Copy `Project URL` → `VITE_SUPABASE_URL`
   - Copy `anon public` key → `VITE_SUPABASE_ANON_KEY`

3. **Start development server**

   ```bash
   npm run dev
   ```

   Expected output:
   ```
   VITE v5.0.7  ready in 234 ms

   ➜  Local:   http://localhost:5173/
   ➜  press h to show help
   ```

   Open http://localhost:5173/ in your browser.

4. **Verify startup**

   The application will:
   - Validate environment variables at startup
   - Initialize the Supabase client
   - Display the bootstrap page with "Estetica" heading

   If you see errors about missing environment variables, see the **Troubleshooting** section below.

### Common Commands

- **Development**: `npm run dev` — starts Vite dev server with hot reload
- **Build**: `npm run build` — compiles TypeScript and bundles for production
- **Preview**: `npm run preview` — serve the built distribution locally
- **Lint**: `npm run lint` — check code quality with ESLint

---

## 7. Troubleshooting

### Missing environment variables

**Error**: `Missing required environment variable: VITE_SUPABASE_URL`

**Solution**:
1. Check that `.env.local` exists in the project root
2. Verify both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Values should not be empty or have placeholder text
4. Restart the dev server after editing `.env.local`

### Invalid Supabase URL

**Error**: `Invalid VITE_SUPABASE_URL: must be an HTTPS URL`

**Solution**:
- URL must start with `https://` and include `supabase.co`
- Correct format: `https://your-project-id.supabase.co`
- Check for typos in the URL copied from Supabase dashboard

### Invalid Supabase key

**Error**: `Invalid VITE_SUPABASE_ANON_KEY: key appears malformed`

**Solution**:
- Copy the full anonymous key from Supabase (usually 100+ characters)
- Ensure you copied the `anon public` key, not the `service_role` key
- Do not modify or truncate the key

### Build fails with TypeScript errors

**Solution**:
- Ensure Node.js 18+ is installed: `node --version`
- Delete `node_modules` and `.vite` cache: `rm -rf node_modules .vite`
- Reinstall: `npm install`
- Rebuild: `npm run build`

### Port 5173 already in use

**Error**: `Port 5173 is already in use`

**Solution**:
- Change the port in `vite.config.ts`, or
- Kill the process using the port: `lsof -ti:5173 | xargs kill -9`

---

## Done

Once these steps are complete, the infrastructure is ready and you can start creating features via OpenSpec.

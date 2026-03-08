# Deploy Nava Web App

## Option 1: Vercel (recommended)

1. **Connect repo:** Go to [vercel.com](https://vercel.com) → New Project → Import `victorotuk/cityhelper-app`
2. **Settings:** Root directory: `.` | Build: `npm run build` | Output: `dist`
3. **Deploy:** Vercel auto-deploys on push to `main`
4. **Custom domain:** Add `vicomnava.com` in Project Settings → Domains

## Option 2: Vercel CLI

```bash
npx vercel login    # one-time auth
npx vercel          # deploy (prompts for project setup)
npx vercel --prod   # deploy to production
```

## Option 3: Netlify

1. Connect repo at [netlify.com](https://netlify.com)
2. Build: `npm run build` | Publish: `dist`
3. Add `_redirects` in `public/`:

```
/*    /index.html   200
```

## Environment

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be set in the hosting platform (Vercel/Netlify env vars).
- Use the same values as your local `.env`.

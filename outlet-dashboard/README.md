# Outlet performance dashboard

Vite + vanilla JS, reading from the Supabase table `public.outlet_weeks`.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

## Deploy to Vercel

1. Push this folder to a Git repo and import it in Vercel (framework preset: Vite).
2. In Project Settings, Environment Variables, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_KEY` (the publishable key)
3. Deploy. Build command `npm run build`, output directory `dist` (Vercel detects both).

Vite reads env variables at build time, so redeploy after changing them.

## Data

`src/data.js` holds all data loading. If the env variables are missing or the request fails,
it falls back to a bundled CSV and the page shows a notice banner.

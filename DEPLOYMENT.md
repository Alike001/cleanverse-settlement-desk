# Deploying Cleanverse Settlement Desk to Vercel

The project is ready for Vercel. The frontend lives in `public/`, and the Express backend is exposed as a Vercel serverless function through `api/index.js`.

## 1. Push to GitHub

```bash
git add .
git commit -m "Prepare Cleanverse Settlement Desk submission"
git push origin main
```

If your branch is `master`, use:

```bash
git push origin master
```

## 2. Import on Vercel

1. Go to `https://vercel.com/new`.
2. Import `Alike001/cleanverse-settlement-desk`.
3. Keep the framework preset as `Other`.
4. Leave build command empty.
5. Leave output directory empty.

## 3. Add environment variables

In Vercel project settings, add:

```bash
CLEANVERSE_ENV=sandbox
CLEANVERSE_BASE_URL=https://uatapi.cleanverse.com/api/cooperate
CLEANVERSE_APP_ID=<paste the App ID from your email>
CLEANVERSE_API_KEY=<paste the API key from your email>
```

Do not paste the API key into GitHub, README, chat screenshots, or demo descriptions.

## 4. Deploy

Click `Deploy`.

After deployment, open:

```text
https://your-vercel-url.vercel.app/api/status
```

You should see:

```json
{
  "configured": true,
  "appIdPresent": true,
  "apiKeyPresent": true,
  "env": "sandbox"
}
```

## Notes

The audit ledger and mandate are persisted to local JSON during local development. On Vercel, serverless storage is temporary, so the history panel is demo persistence only. For production, replace it with a database such as Neon, Supabase, or Vercel Postgres.

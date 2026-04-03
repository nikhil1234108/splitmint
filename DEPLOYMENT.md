# Deployment Kit

This app is ready to deploy to Vercel with Supabase and Gemini.

## 1. Pre-deploy checklist

- Push the repo to GitHub
- Create a Supabase project
- Run `lib/supabase/schema.sql` in the Supabase SQL editor
- If your policies are already broken, run:
  - `lib/supabase/fix-groups-rls.sql`
  - or `lib/supabase/reset-rls-policies.sql`
- Create a Gemini API key

## 2. Required environment variables

Use `.env.production.example` as the template.

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_API_KEY`
- `GEMINI_MODEL`

## 3. Deploy on Vercel

1. Import the GitHub repo into Vercel
2. Framework preset: `Next.js`
3. Add the production environment variables
4. Deploy

## 4. Health check

After deploy, test:

- `/api/health`

Expected response:

```json
{
  "ok": true,
  "service": "splitmint"
}
```

## 5. Recommended post-deploy test flow

- Register a user
- Login
- Create a group
- Add an expense manually
- Test MintSense with Gemini
- Check balances and settlement explanation

## 6. Troubleshooting

### Group creation fails with RLS errors

Run the SQL policy fixes in `lib/supabase/`.

### MintSense fails

Check that:

- `GOOGLE_API_KEY` is set
- the Gemini key is active
- `GEMINI_MODEL` is valid

### Build validation

Run locally:

```bash
npm run typecheck
```

# SplitMint

Smart group expense splitting with Supabase, Next.js, and MintSense AI.

## Features

- Email login and registration
- Create groups with up to 3 additional participants
- Add expenses with equal, custom, or percentage splits
- Balance summaries and settlement suggestions
- Natural-language expense parsing with MintSense
- AI summaries and settlement explanations using Gemini

## Tech Stack

- Next.js App Router
- React
- Supabase Auth + Postgres + RLS
- TypeScript
- Gemini API

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GOOGLE_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

### 3. Set up Supabase

Run the SQL in:

- `lib/supabase/schema.sql`

If your RLS policies are already in a broken state, use:

- `lib/supabase/fix-groups-rls.sql`
- `lib/supabase/reset-rls-policies.sql`

### 4. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Production Deployment

Use the deployment kit in:

- `DEPLOYMENT.md`
- `.env.production.example`
- `vercel.json`

Health endpoint:

- `/api/health`

## Project Structure

```text
app/
  api/
  (auth)/
  (dashboard)/
components/
lib/
  balance-engine.ts
  langchain/
  supabase/
types/
```

## Notes

- MintSense now uses Gemini, not Anthropic.
- `.env.local` is ignored and should not be committed.
- `node_modules` and `.next` are ignored and should not be pushed.

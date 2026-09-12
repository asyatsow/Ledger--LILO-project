# Ledger

**Know where you stand.**

Ledger is a Track 2 hackathon MVP for students who use AI while learning to code. It treats AI assistance as useful, but measures whether that assistance becomes independent ability.

## Core loop
1. Paste buggy Python code + error into **Log a bug**.
2. Claude fixes it and tags one of five concepts: off-by-one, null handling, scope error, type mismatch, or logic error.
3. Ledger records an open **learning debt** entry.
4. **Test me** presents a pre-written transfer question for that concept with AI assistance off.
5. Claude grades whether the student's explanation demonstrates real understanding.
6. Pass resolves the debt and updates readiness.

## Stack
Next.js App Router, TypeScript, Tailwind CSS, Supabase Postgres/Auth, Anthropic Claude API, Vercel.

## Environment
Copy `.env.example` to `.env.local`. Add the Supabase variables from the starter template and `ANTHROPIC_API_KEY`. If no Claude key is present, deterministic fallbacks keep the demo usable.

## Important demo/security choice
This MVP never executes arbitrary student code on the server. The AI/fallback layer analyzes the supplied code and grades the written transfer answer. A production version should add an isolated code sandbox if execution is required.

## Structure
- `src/app/dashboard` — readiness dashboard
- `src/app/log-bug` — AI-assisted bug logging
- `src/app/test/[concept]` — independent transfer test
- `src/app/api/fix` — server-side Claude diagnosis
- `src/app/api/grade` — server-side Claude grading
- `src/lib/questions.json` — deterministic transfer bank
- `src/lib/store.ts` — demo persistence
- `supabase/migrations` — debt schema/RLS

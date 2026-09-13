# Ledger

**Make sure the skill is yours.**

AI can get you unstuck. Ledger helps you know what stuck with you.

Built in 12 hours for the LILO Summer Academy Hackathon 2026 (Track 2: Leverage AI).

---

## Quick Start

```bash
git clone <this-repo-url>
cd ledger
npm install
cp .env.example .env.local   # then fill in the 4 keys below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). That's it for running it locally. The Supabase setup below only needs to happen once, the first time.

### Environment variables (put these in `.env.local`)

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard, Settings, API, Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page, `anon public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page, `service_role` key (keep secret, server-side only) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/) |

### One-time Supabase setup

1. Create a free project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In the SQL Editor, run the table and policies from [Database Schema](#database-schema) below.
3. Under **Authentication, Emails, Magic Link**, swap the template to use `{{ .Token }}` instead of `{{ .ConfirmationURL }}`. This is what lets Ledger's login use a 6-digit code instead of a link.

---

## The Problem

Every student now codes with AI open in another tab. That's not a problem, that's just how coding works in 2026. The problem is nobody, including the student, can tell the difference between "I understand this" and "AI understood this for me," until they're in an interview with no AI allowed and it's too late to find out. Claude, Copilot, Cursor: none of them remember your last bug when helping with your next one, so the pattern is invisible.

Ledger makes it visible. Every AI-assisted fix gets logged and tagged by concept. Later, Ledger tests you on that same concept with a different problem (no AI) and only then clears the debt. The dashboard reads like an honest interview-readiness report: which concepts you can actually rely on yourself for, and which ones are still borrowed understanding. That's the "AI as a learning tool, not a crutch" theme Track 2 is built around, made into something you can actually measure instead of just aspire to.

## The Solution

Ledger is the layer that comes after the fix. It's not a faster debugger, and it's not a replacement for the AI tools you already use. Think of Claude as the gym where the work happens, and Ledger as the tracker that remembers your history across sessions.

**Who it's for:** any student coding alongside AI, especially while prepping for interviews where AI won't be there to help.

## How It Works

1. **Save the fix**: log a bug you used AI to solve
2. **Find the concept**: Claude classifies the underlying concept
3. **Add it to Ledger**: logged as a skill to practice
4. **Try it solo**: a new, related problem, no AI
5. **Check the answer**: Claude grades independent understanding
6. **Close the loop**: dashboard updates your Independence %

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | [Next.js](https://nextjs.org/) (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Auth + Database | [Supabase](https://supabase.com/) (Postgres, with row-level security) |
| AI | [Anthropic Claude API](https://www.anthropic.com/api) |
| Hosting | [Vercel](https://vercel.com/) |

**Flow:** bug logged → concept tagged → stored in Supabase → later retrieved for an independent test → graded by Claude → dashboard reflects the new score. Full sequence diagram is in the slide deck.

## Database Schema

```sql
create table debt_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  concept text not null,               -- off_by_one | null_handling | scope_error | type_mismatch | logic_error
  original_error text not null,
  ai_fix_summary text not null,
  status text not null default 'open', -- 'open' or 'resolved'
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table debt_entries enable row level security;

create policy "select own" on debt_entries for select using (auth.uid() = user_id);
create policy "insert own" on debt_entries for insert with check (auth.uid() = user_id);
create policy "update own" on debt_entries for update using (auth.uid() = user_id);
```

`independence % = (resolved entries for a concept / total entries for that concept) * 100`

## Project Structure

```
ledger/
├── src/app/
│   ├── dashboard/           # independence %, skill list
│   ├── log-bug/             # submit a bug, calls /api/fix
│   ├── test/[concept]/      # transfer test, calls /api/grade
│   ├── login/               # Supabase email OTP
│   └── api/{fix,grade}/     # Claude-backed API routes
├── src/lib/
│   ├── supabase/            # browser + server clients
│   └── transfer-questions.json
└── supabase/migrations/     # the SQL above
```

## API Reference

**`POST /api/fix`**: `{ code, error }` → `{ fix, concept, summary }`
`concept` is always one of the five fixed values above. This is enforced in the prompt so the dashboard and question bank never drift out of sync.

**`POST /api/grade`**: `{ entry_id, concept, question_id, user_answer }` → `{ pass, feedback }`
A `pass: true` result flips the entry's `status` to `resolved`.

## Known Limitations

- Confirm whether the app is on Supabase or still using browser `localStorage` before demoing. Verify before you claim persistence.
- Five concepts are hardcoded for MVP scope; transfer questions are hand-curated, not live-generated (a deliberate reliability choice, not a limitation of Claude); single-language support only.

## Roadmap

**Next:** a browser overlay that connects Ledger directly to the platforms you're already practicing on, like LeetCode, HackerRank, or whatever site you're solving problems on, so a transfer test can be triggered right there instead of switching tabs. Beyond that: deploy on Vercel with a public link, add interview-readiness sharing and export, and broaden concept and language coverage.

## Design System

See [`ledger-ui-design-spec.md`](./ledger-ui-design-spec.md) for typography (Fraunces / IBM Plex Sans / IBM Plex Mono) and the color system (blue = Learning, amber = Almost there, green = Proven).

## Team

Built by **Asyat Sow**, **Sharon Abbita**, and **Mary-Kate Laibhen** for the LILO Summer Academy Hackathon 2026.

# Ledger: LILO-project
# TEMPORARY READ-ME FOR SHARON AND MARY-KATE TO UNDERSTAND
# Ledger

Ledger helps students turn AI-assisted coding into real, independent skill.

Students use AI all the time to fix bugs and solve coding problems. The problem is that getting the correct answer does not always mean you understand how to solve the problem yourself.

Ledger keeps track of the coding concepts where AI helped you, then tests you later without AI.

## How it works

1. Paste in a coding bug you used AI to fix.
2. Ledger uses Claude to identify the underlying concept.
3. Ledger records that as "learning debt."
4. Later, Ledger gives you a different question testing the same concept.
5. You answer without AI.
6. Ledger evaluates your understanding.
7. If you demonstrate the skill, the debt is cleared.
8. Your interview-readiness dashboard updates.

In short:

AI helps you solve the problem.
Ledger helps you make sure the skill actually stuck.

## Why Ledger?

AI makes coding faster, but students still need to know what they can do independently.

Ledger does not tell students to stop using AI.

It helps them understand whether their AI-assisted progress has become a skill they can actually rely on.

## Built for

LILO Summer Academy Hackathon 2026

Track 2 — Leverage AI

> AI as a learning tool that boosts productivity without becoming a crutch.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- Anthropic Claude API
- Vercel

## Project Status

This is an MVP built for the LILO Summer Academy Hackathon.

## Running Locally

Install dependencies:

npm install

Create `.env.local` using `.env.example` and add your Supabase and Anthropic credentials.

Then run:

npm run dev

Open:

http://localhost:3000

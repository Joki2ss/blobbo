# SXR Managements

Expo (managed) multi-tenant B2B demo app.

## Demo logins (MOCK)

This repo does not store real passwords/secrets. In MOCK mode, seed users may be created locally.

## Structure

- Root `App.js` is a wrapper that exports `LAB/App.js` (Snack-compatible).

## Supabase (LIVE/CLOUD) setup

Quick ways to “see” whether Supabase is wired:

- Look for the `supabase/` folder (migrations live in `supabase/migrations/`).
- If you use Supabase CLI, check it’s available: `npx supabase --version`.

This repo currently includes SQL migrations for a hardened schema (RLS + developer-only moderation RPCs), but does not include any project-specific secrets.

## Supabase security smoke test (recommended)

This repo includes a small Node script that verifies:

- A normal user can insert into `public.feed_posts` (via RLS)
- A normal user cannot call `public.dev_update_post` (blocked by DB role check)
- A developer user can call `public.dev_update_post` and audit is written

Steps:

1. Copy `.env.example` to `.env` (already git-ignored) and fill values locally.
2. Run: `npm run supabase:smoke`

Tip:

- You can set a single `COMMON_PASSWORD` and omit `DEV_PASSWORD` / `USER_PASSWORD`.

Important:

- Use only the Supabase **publishable/anon key** for this test.
- Never commit `.env` or paste secrets into chat.

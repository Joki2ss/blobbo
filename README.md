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

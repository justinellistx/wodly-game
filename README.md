# WODLY — the fitness board game

Live at **https://wodlygame.com**. Roll the dice, land on a card, do the reps. First to the WIN square takes it.
Static HTML/JS pages on **Vercel** (auto-deploys from `main` of `justinellistx/wodly-game`) with a **Supabase**
backend (project `ynznwosssctxbdiauekj`). No build step: edit a file, push to `main`, it's live in about a minute.

## Pages

| Path | What it is |
|---|---|
| `/` (`index.html`) | Homepage, hero video, promo cards, email sign-up |
| `/board` | Host / big-screen game. Setup screen, board picker, presets. `?solo=1` opens solo / pass-and-play |
| `/play` | Phone controller for a multiplayer room (join by 4-letter code / QR) |
| `/lobby` | Public Open Play rooms (seeded every 30 min) + create a public room |
| `/daily` | Daily Workout — one shared workout per day with its own leaderboard |
| `/bingo`, `/bplay` | WODLY Bingo host screen / phone card |
| `/wild`, `/wplay` | Wild mode host / phone |
| `/leaderboard`, `/gyms`, `/me` | Community stats, gym leaderboard, a player's personal stats (looked up by email) |
| `/admin` | Passcode admin: analytics, daily workouts, sponsors, digest preview/send |
| `/terms`, `/privacy`, `/unsubscribe` | Legal + email unsubscribe |
| `solo.html` | Older standalone solo page. Not linked from the site any more; `/board?solo=1` replaced it |

## Shared scripts

- `wodly-core.js` — constants, card logic, **board themes (`BOARDS`)**, **workout presets (`PRESETS`)**, Supabase helpers, Double Dice spot picker.
- `wodly-board.js` — board renderer used by the phone controller.
- `wodly-fx.js` — win / bingo animations.
- `wodly-halloween.js`, `wodly-thanksgiving.js` — seasonal decorations (see below).

## Game rules live in TWO places — keep them in sync

Multiplayer rolls are resolved server-side by the Supabase edge function **`match`**; solo rolls are resolved in
`board.html`. Any rule change (card kinds, skip/back behaviour, Double Dice, finish logic) must be made in both.
Last checked in sync: 2026-11-02.

## Supabase

- **Edge functions:** `match` (multiplayer game engine), `send-recap` (post-game email), `weekly-digest`
  (Monday email), `unsubscribe`, `go` (sponsor click redirect, proxied at `/go`), `email-events`, `sponsor-admin`.
- **Cron:** `seed-public-rooms` every 5 min (keeps Open Play rooms scheduled 5am–8pm Central); `weekly-digest`
  Mondays 13:00 UTC.
- **Security model:** RLS on every table; public reads/writes go through specific RPCs. Admin-only functions are
  revoked from `anon`. The site's publishable key is public by design.
- **Storage:** public bucket `recaps` holds shareable recap cards. Uploads must use `upsert:false` — the public
  role can insert but not update.
- **Email:** sent through Resend. `RESEND_FROM`, `WODLY_POSTAL_ADDR`, `WODLY_CONTACT_EMAIL` are edge-function secrets.

## Seasonal themes

Each season is a board in `BOARDS`, a preset in `PRESETS` (category `Holiday`), and a self-dating decoration script
included on every page. Nothing needs redeploying when a season starts or ends.

| Season | Board / preset | Decorations | Defaults (board pre-selected, Open Play rooms) |
|---|---|---|---|
| Halloween | `halloween` / `monstermash` | Oct 29 – Nov 1 | same window |
| Thanksgiving | `thanksgiving` / `gobble` | Nov 2 – Sunday after Thanksgiving (themed homepage too) | Thanksgiving week, Mon–Sun |

Preview any time with `?halloween=1` or `?thanksgiving=1` on any page. Deep link to a themed game:
`/board?board=thanksgiving&preset=gobble`. Open Play seasonal logic lives in the SQL function `seed_public_rooms()`.
To add a season: board art (1254×1254 JPG, keep the middle clear) in `assets/`, entry in `BOARDS` + `PRESETS`,
name in admin's `B_NAME`, copy a decoration script, include it in every page, add a branch to `seed_public_rooms()`.

## Testing

Serve locally with `python3 -m http.server 8765` and drive pages with Playwright (390×844 phone, 1280×720 TV).
Mock Supabase with `page.route(/supabase\.co/, …)` so tests never write production data.

## Audit log

### 2026-11-02 full audit
Clean: all 17 pages load with no JS errors, no failed requests, no horizontal scroll on phones; a full solo game
plays to the finish and shows the recap; client and server game rules match; no DB / edge function errors in 24h.

Fixed in this pass:
- Recap image cards had been failing to upload since early July (`upsert:true` needs UPDATE rights) — emails went
  out without the shareable card. Now `upsert:false`.
- Pinned `@supabase/supabase-js` to `2.118.0` on every page (was the floating `@2`).

Open items (not changed):
1. **One-click unsubscribe is broken.** Emails' `List-Unsubscribe` header points at `/unsubscribe?token=…`, a static
   page that answers POST with 405. Point the header at the `unsubscribe` edge function instead (`send-recap`,
   `weekly-digest`). The visible unsubscribe link in the email footer still works.
2. **First recap email can carry a token-less unsubscribe link** — `play.html` calls `send-recap` before the
   subscriber row exists. Insert the subscriber first, then send.
3. **`/me` shows anyone's stats by email** (no login). Low-sensitivity data; fix = emailed magic link.
4. **`add_movement` is open to the public** with no length/content limit, and new names show in everyone's
   movement dropdown. Add a length cap and a simple blocklist.
5. **Emails send from `wodly@complegends.com`** (the `RESEND_FROM` secret), not a wodlygame.com address. Verify
   wodlygame.com in Resend and switch.
6. **Page weight:** `/board` ~6.5 MB, `/play` ~4.9 MB on first load. Biggest wins: `assets/board-bg.png` (2.5 MB, the
   default Classic board → JPG ≈300 KB) and the 12 character PNGs (~200 KB each → WebP). Unused:
   `board-forge.png`, `board-midnight.png`, `board-steel.png`.
7. **`wodly-site-update/` is deployed publicly** (an old copy of the site, e.g. `/wodly-site-update/admin`). Delete it
   from the repo or add it to `.vercelignore`.
8. Sponsor logos stored as base64 data URIs don't render in Gmail; host them as files.
9. Supabase advisor notes (low): `citext` / `pg_net` in public schema, 2 unindexed foreign keys, 4 unused indexes.
10. Usage: 3 hosted rooms and 6 recaps in the last 30 days; nobody joined an Open Play room in 30 days.

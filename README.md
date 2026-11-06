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

## Partner mode

Setup has **Teams: Solo / Partners** (deep link `?team=2`). Partners (`settings.teamSize = 2`) doubles every card
and the ace penalty in BOTH engines (`board.html` solo + the `match` edge function); cards carry `each` and show
"12 (6 each)". Choosing Partners switches the deck to Fast — doubled reps on Fast ≈ the same work as Solo on
Standard. Recaps (`W.recapFromHist`): `byMove`/`total` are each partner's share (leaderboards, `/me`), while
`order` keeps the team's real reps so `movement_pace` time-per-rep stays accurate for I-go-you-go. Phones name the
team "Ann & Bo" and take a partner email; each partner gets their own recap. The phone saves the subscriber
before sending the recap, so the email's unsubscribe link always has a token.

## Supabase

- **Edge functions:** `match` (multiplayer game engine), `send-recap` (post-game email), `weekly-digest`
  (Monday email), `unsubscribe`, `go` (sponsor click redirect, proxied at `/go`), `email-events`, `sponsor-admin`.
- **Cron:** `seed-public-rooms` every 5 min keeps Open Play rooms at three fixed times a day, 6am / noon / 6pm
  Central (changed 2026-11-02 from every 30 min, so the few online players meet in one room); `weekly-digest`
  Mondays 13:00 UTC.
- **Security model:** RLS on every table; public reads/writes go through specific RPCs. Admin-only functions are
  revoked from `anon`. The site's publishable key is public by design.
- **Storage:** public bucket `recaps` holds shareable recap cards. Uploads must use `upsert:false` — the public
  role can insert but not update. Public bucket `sponsor-logos` holds email copies of sponsor logos (written only by
  the email functions; see below).
- **Email:** sent through Resend. `RESEND_FROM`, `WODLY_POSTAL_ADDR`, `WODLY_CONTACT_EMAIL` are edge-function secrets.
  - The `List-Unsubscribe` header points at the `unsubscribe` **edge function** (one-click POST from Gmail/Yahoo),
    plus a mailto fallback. The footer link points at the `/unsubscribe` page. Both use the subscriber's `unsub_token`.
  - Sponsor logos are stored as data URIs in `sponsors.logo`; Gmail won't show those, so `send-recap` and
    `weekly-digest` upload them to `sponsor-logos/<content-hash>.<ext>` on first use and link the hosted file.

## Seasonal themes

Each season is a board in `BOARDS`, a preset in `PRESETS` (category `Holiday`), and a self-dating decoration script
included on every page. Nothing needs redeploying when a season starts or ends.

| Season | Board / preset | Decorations | Defaults (board pre-selected, Open Play rooms) |
|---|---|---|---|
| Halloween | `halloween` / `monstermash` | Oct 29 – Nov 1 | same window |
| Thanksgiving | `thanksgiving` / `gobble` (home, bodyweight) + `turkeyburn` = "Turkey WOD (gym)" (in-gym: wall balls, KB swings, row, box jumps); the homepage counts down to the Turkey WOD (Tue Nov 24, 5am CT — `EVENT` in `wodly-thanksgiving.js`) | Nov 2 – Sunday after Thanksgiving (themed homepage too) | Thanksgiving week, Mon–Sun |

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
1. ~~One-click unsubscribe broken~~ — fixed 2026-11-02.
2. **First recap email can carry a token-less unsubscribe link** — `play.html` calls `send-recap` before the
   subscriber row exists. Insert the subscriber first, then send.
3. **`/me` shows anyone's stats by email** (no login). Low-sensitivity data; fix = emailed magic link.
4. **`add_movement` is open to the public** with no length/content limit, and new names show in everyone's
   movement dropdown. Add a length cap and a simple blocklist.
5. **Emails send from `wodly@complegends.com`** (the `RESEND_FROM` secret), not a wodlygame.com address. Verify
   wodlygame.com in Resend and switch.
6. ~~Page weight~~ — fixed 2026-11-02: `/board` 6.5 MB → ~0.8 MB, `/play` 4.9 MB → ~0.7 MB (Classic board as JPG,
   palette-compressed character/bingo PNGs, 240px picker thumbnails, unused boards removed). The bingo tile images
   (`cell-*.png`) were left uncompressed on purpose — compression showed grain on their texture.
7. ~~Old site copy deployed publicly~~ — `wodly-site-update/` removed 2026-11-02.
8. ~~Sponsor logos missing in Gmail~~ — fixed 2026-11-02 (hosted copies, see Email above).
9. Supabase advisor notes (low): `citext` / `pg_net` in public schema, 2 unindexed foreign keys, 4 unused indexes.
10. Usage: 3 hosted rooms and 6 recaps in the last 30 days; nobody joined an Open Play room in 30 days.

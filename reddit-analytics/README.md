# Subreddit Analytics Crawler

Crawls up to a few subreddits over a given timeframe and reports total posts,
total comments, and total upvotes — with the ability to exclude posts by
title keyword (e.g. "don't count the post that says Giveaway") from the
totals.

Requires Node.js 18+ and a free Reddit "script" app (see Setup below) —
Reddit now requires a logged-in session to browse even old.reddit.com, so
the no-signup browser fallback this tool originally used no longer works.
The official API path below is the reliable one.

## Setup

```bash
cd reddit-analytics
npm install
```

Then get free API credentials (no Reddit username/password needed, just a
few minutes):

1. Log into Reddit and go to <https://www.reddit.com/prefs/apps>.
2. Click **create another app...** at the bottom.
3. Choose type **script**, give it any name (e.g. `subreddit-analytics`),
   and put anything in the required "redirect uri" field (e.g.
   `http://localhost:8080` — it's unused for this flow).
4. Click **create app**. You'll see a client ID (the string under the app
   name/type) and a **secret**.
5. Provide those to the CLI either as flags or environment variables:

```bash
# flags
node crawler.mjs -s webdev -d 7 --client-id YOUR_ID --client-secret YOUR_SECRET

# or environment variables (PowerShell)
$env:REDDIT_CLIENT_ID="YOUR_ID"
$env:REDDIT_CLIENT_SECRET="YOUR_SECRET"
node crawler.mjs -s webdev -d 7

# or environment variables (bash/zsh)
export REDDIT_CLIENT_ID="YOUR_ID"
export REDDIT_CLIENT_SECRET="YOUR_SECRET"
node crawler.mjs -s webdev -d 7
```

This uses the read-only `client_credentials` grant, scoped to public data —
no Reddit password is ever entered anywhere in this tool.

## Usage

```bash
node crawler.mjs --subreddits webdev,programming,javascript --days 7
```

Save the report to a file and also dump the raw data as JSON:

```bash
node crawler.mjs -s webdev -d 30 -o reports/webdev-30d.md --json
```

Exclude posts whose title contains a given word or phrase (case-insensitive,
substring match) from all totals — this is how you'd handle "don't count the
post that says 'Giveaway'":

```bash
node crawler.mjs -s webdev -d 7 -x "Giveaway"
```

Multiple exclusion terms:

```bash
node crawler.mjs -s webdev -d 7 -x "Giveaway,Mod Announcement,Meta"
```

### Options

| Flag | Description | Default |
| --- | --- | --- |
| `-s, --subreddits <list>` | Comma-separated subreddit names, no `r/` prefix (max 3 recommended) | required |
| `-d, --days <n>` | Timeframe in days to look back | `7` |
| `-x, --exclude <list>` | Comma-separated title substrings to exclude from totals | none |
| `--max-pages <n>` | Max pages of ~25 posts fetched per subreddit (rate-limit safety cap) | `10` |
| `-o, --out <path>` | Write the markdown report to a file (also prints to stdout) | none |
| `--json` | Also write a `.json` file with the raw report data next to `--out` | off |
| `--user-agent <str>` | Custom browser/API User-Agent string | a recent desktop Chrome string |
| `--client-id <str>` | Reddit script app client id (see Setup above) — required for reliable results (or set `REDDIT_CLIENT_ID`) | none |
| `--client-secret <str>` | Reddit script app client secret (or set `REDDIT_CLIENT_SECRET`) | none |

## What the report includes

For the combined set of subreddits, and for each subreddit individually:

- **Raw totals**: posts, comments, upvotes for the timeframe
- **Adjusted totals**: the same, after removing any excluded posts
- A list of which posts were excluded and which keyword matched
- Top 5 posts by upvotes and top 5 by comments

## How it works

- With `--client-id`/`--client-secret`, exchanges them for a short-lived
  app-only OAuth token and fetches `https://oauth.reddit.com/r/<subreddit>/new`,
  paginating with Reddit's `after` cursor until it reaches posts older than
  the requested timeframe. Stickied/pinned posts are ignored for that cutoff
  check, since Reddit shows them out of chronological order.
- Only counts a post's current `score` (net upvotes) and comment count —
  Reddit doesn't expose separate upvote/downvote counts or a historical
  comment-count-over-time breakdown.

### Fallback: no-signup browser mode (currently broken)

Without credentials, the crawler falls back to launching headless Chromium
and reading `https://old.reddit.com/r/<subreddit>/new/` directly, the way it
originally worked. **As of September 2026, Reddit redirects logged-out
requests to old.reddit.com to a login page**, so this fallback reliably
fails now — it'll throw a clear "Reddit redirected ... to a login page"
error rather than silently reporting zero posts. Left in the code in case
Reddit reverts this; use `--client-id`/`--client-secret` in the meantime.

## Notes / limitations

- Very high-volume subreddits may have more posts in the requested window
  than `maxPages` pages cover; increase `--max-pages` if the reported post
  count looks truncated (the CLI logs how many posts it found per
  subreddit, and warns if it found zero).
- DOM scraping (fallback mode) is inherently more fragile than an API — if
  Reddit changes old.reddit.com's markup, extraction may need updating in
  `lib/reddit-browser-client.mjs`. If a subreddit comes back with 0 posts
  unexpectedly, the CLI saves a snapshot of what the browser actually loaded
  to `debug/<subreddit>.html` and `debug/<subreddit>.png` for inspection.
- This tool was built and unit-tested (including against a realistic HTML
  fixture, offline) in a sandboxed environment that does not have network
  access to reddit.com — issues that only show up against live Reddit data
  (like the login-wall change above) get diagnosed from what's reported
  back after a real run.

## Tests

```bash
cd reddit-analytics
npm test
```

Covers report aggregation/exclusion logic, OAuth API pagination/cutoff logic
(fake `fetch`), and the browser-based DOM extraction logic (a real headless
browser loading a local HTML fixture) — all fully offline, no calls to
reddit.com.

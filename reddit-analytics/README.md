# Subreddit Analytics Crawler

Crawls up to a few subreddits over a given timeframe and reports total posts,
total comments, and total upvotes — with the ability to exclude posts by
title keyword (e.g. "don't count the post that says Giveaway") from the
totals.

Requires Node.js 18+ (for built-in `fetch`) and a free Reddit "script" app
(see [Setup](#setup) below) — Reddit now blocks most unauthenticated
requests to its JSON listing endpoints with a `403`.

## Setup

Reddit's public `.json` endpoints reject unauthenticated traffic for most
clients, so you need a free OAuth app-only token:

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

No Reddit username/password is needed — this uses the read-only
`client_credentials` grant, scoped to public data only.

## Usage

```bash
cd reddit-analytics
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
| `--max-pages <n>` | Max pages of 100 posts fetched per subreddit (rate-limit safety cap) | `10` |
| `-o, --out <path>` | Write the markdown report to a file (also prints to stdout) | none |
| `--json` | Also write a `.json` file with the raw report data next to `--out` | off |
| `--user-agent <str>` | Custom `User-Agent` header — Reddit requires a descriptive one | `subreddit-analytics-crawler/1.0 (personal use script)` |
| `--client-id <str>` | Reddit script app client id (or set `REDDIT_CLIENT_ID`) | none |
| `--client-secret <str>` | Reddit script app client secret (or set `REDDIT_CLIENT_SECRET`) | none |

## What the report includes

For the combined set of subreddits, and for each subreddit individually:

- **Raw totals**: posts, comments, upvotes for the timeframe
- **Adjusted totals**: the same, after removing any excluded posts
- A list of which posts were excluded and which keyword matched
- Top 5 posts by upvotes and top 5 by comments

## How it works

- Exchanges your client id/secret for a short-lived app-only OAuth token
  (`getAccessToken`), then fetches `https://oauth.reddit.com/r/<subreddit>/new`,
  paginating with Reddit's `after` cursor until it reaches posts older than
  the requested timeframe (stickied/pinned posts are ignored for that cutoff
  check, since Reddit shows them out of chronological order). Without
  credentials it falls back to the unauthenticated `www.reddit.com/....json`
  endpoint, which Reddit rejects with a `403` for most clients.
- Adds a short delay between page requests and retries with backoff on
  `429`/`5xx` responses to stay within Reddit's rate limits.
- Only counts a post's current `score` (net upvotes) and `num_comments` —
  Reddit's listing API doesn't expose separate upvote/downvote counts or a
  historical comment-count-over-time breakdown.

## Notes / limitations

- Very high-volume subreddits may have more than `maxPages * 100` posts in
  the requested window; increase `--max-pages` if the reported post count
  looks truncated (the CLI logs how many posts it found per subreddit).
- Reddit's endpoints are still rate limited even with a token; if you see
  repeated `429` errors, increase the delay in `lib/reddit-client.mjs`
  (`pageDelayMs`) or run fewer subreddits at once.
- This tool was built and unit-tested with mocked HTTP responses in a
  sandboxed environment that does not have network access to reddit.com.
  Run it somewhere with normal internet access.

## Tests

```bash
cd reddit-analytics
npm test
```

Tests cover the aggregation/exclusion logic and the pagination/cutoff logic
using fixture data and a fake `fetch`, so they run without hitting Reddit.

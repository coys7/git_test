# Subreddit Analytics Crawler

Crawls up to a few subreddits over a given timeframe and reports total posts,
total comments, and total upvotes — with the ability to exclude posts by
title keyword (e.g. "don't count the post that says Giveaway") from the
totals.

No Reddit account or API signup needed. Requires Node.js 18+.

## Setup

```bash
cd reddit-analytics
npm install
```

That's it. `npm install` pulls in [Playwright](https://playwright.dev), which
drives a real (headless) Chromium browser to read Reddit pages like a normal
visitor — Reddit blocks plain, non-browser HTTP requests to its JSON API, so
this sidesteps that entirely with zero setup on your end. The first
`npm install` downloads a Chromium binary (~150-300MB), which is a one-time
cost.

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
| `--user-agent <str>` | Custom browser User-Agent string | a recent desktop Chrome string |
| `--client-id <str>` | *(Advanced, optional)* Reddit script app client id — switches to the faster official API instead of browser scraping (or set `REDDIT_CLIENT_ID`) | none |
| `--client-secret <str>` | *(Advanced, optional)* Reddit script app client secret (or set `REDDIT_CLIENT_SECRET`) | none |

## What the report includes

For the combined set of subreddits, and for each subreddit individually:

- **Raw totals**: posts, comments, upvotes for the timeframe
- **Adjusted totals**: the same, after removing any excluded posts
- A list of which posts were excluded and which keyword matched
- Top 5 posts by upvotes and top 5 by comments

## How it works

- By default, launches headless Chromium and navigates to
  `https://old.reddit.com/r/<subreddit>/new/` (the simpler, server-rendered
  version of Reddit), reading post title/score/comment-count/timestamp
  straight out of the page, and following the "next" pagination link until
  it passes the requested timeframe. Stickied/pinned posts are ignored for
  that cutoff check, since Reddit shows them out of chronological order.
- Only counts a post's current `score` (net upvotes) and comment count —
  Reddit doesn't expose separate upvote/downvote counts or a historical
  comment-count-over-time breakdown to anonymous visitors.
- Adds a short delay between page loads to be a well-behaved visitor.

### Advanced: official API mode

If you pass `--client-id`/`--client-secret` (from a free Reddit "script" app,
see <https://www.reddit.com/prefs/apps> → "create another app..." → type
**script**), the crawler uses Reddit's official OAuth API instead
(`oauth.reddit.com`), which is faster and doesn't need a browser. No Reddit
username/password is required — just the app-only `client_credentials` grant,
scoped to public read-only data.

## Notes / limitations

- Very high-volume subreddits may have more posts in the requested window
  than `maxPages` pages cover; increase `--max-pages` if the reported post
  count looks truncated (the CLI logs how many posts it found per
  subreddit, and warns if it found zero).
- DOM scraping is inherently more fragile than an API — if Reddit changes
  old.reddit.com's markup, extraction may need updating in
  `lib/reddit-browser-client.mjs`. Unauthenticated/anonymous-only
  subreddits are supported; private or quarantined subreddits are not.
- This tool was built and unit-tested (including against a realistic HTML
  fixture, offline) in a sandboxed environment that does not have network
  access to reddit.com. It has not been run against live Reddit data — run
  it somewhere with normal internet access and let me know if anything
  looks off.

## Tests

```bash
cd reddit-analytics
npm test
```

Covers report aggregation/exclusion logic, OAuth API pagination/cutoff logic
(fake `fetch`), and the browser-based DOM extraction logic (a real headless
browser loading a local HTML fixture) — all fully offline, no calls to
reddit.com.

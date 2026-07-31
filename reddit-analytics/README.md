# Subreddit Analytics Crawler

Crawls up to a few subreddits over a given timeframe and reports total posts,
total comments, and total upvotes — with the ability to exclude posts by
title keyword (e.g. "don't count the post that says Giveaway") from the
totals.

No API key or Reddit app registration required — it uses Reddit's public
`.json` listing endpoints. Requires Node.js 18+ (for built-in `fetch`).

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

## What the report includes

For the combined set of subreddits, and for each subreddit individually:

- **Raw totals**: posts, comments, upvotes for the timeframe
- **Adjusted totals**: the same, after removing any excluded posts
- A list of which posts were excluded and which keyword matched
- Top 5 posts by upvotes and top 5 by comments

## How it works

- Fetches `https://www.reddit.com/r/<subreddit>/new.json`, paginating with
  Reddit's `after` cursor until it reaches posts older than the requested
  timeframe (stickied/pinned posts are ignored for that cutoff check, since
  Reddit shows them out of chronological order).
- Adds a short delay between page requests and retries with backoff on
  `429`/`5xx` responses to stay within Reddit's unauthenticated rate limits.
- Only counts a post's current `score` (net upvotes) and `num_comments` —
  Reddit's public listing API doesn't expose separate upvote/downvote counts
  or a historical comment-count-over-time breakdown.

## Notes / limitations

- Very high-volume subreddits may have more than `maxPages * 100` posts in
  the requested window; increase `--max-pages` if the reported post count
  looks truncated (the CLI logs how many posts it found per subreddit).
- Reddit's unauthenticated JSON endpoints are subject to rate limiting; if
  you see repeated `429` errors, increase the delay in
  `lib/reddit-client.mjs` (`pageDelayMs`) or run fewer subreddits at once.
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

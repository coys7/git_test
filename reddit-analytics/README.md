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
npx playwright install chromium
```

`npm install` pulls in [Playwright](https://playwright.dev), which drives a
real (headless) Chromium browser to read Reddit pages like a normal visitor.
`npx playwright install chromium` downloads the actual browser binary
(~150-300MB), which is a one-time cost; `npm install`'s automatic postinstall
download doesn't always fire (npm config, antivirus, etc. can block it), so
run this explicitly if you see an "Executable doesn't exist" error.

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
| `--max-pages <n>` | Max scroll batches per subreddit (rate-limit/runaway-scroll safety cap) | `10` |
| `-o, --out <path>` | Write the markdown report to a file (also prints to stdout) | none |
| `--json` | Also write a `.json` file with the raw report data next to `--out` | off |
| `--user-agent <str>` | Custom browser User-Agent string | a recent desktop Chrome string |
| `--client-id <str>` | *(Optional)* Reddit script app client id — switches to the official API instead of browser scraping (or set `REDDIT_CLIENT_ID`) | none |
| `--client-secret <str>` | *(Optional)* Reddit script app client secret (or set `REDDIT_CLIENT_SECRET`) | none |

## What the report includes

For the combined set of subreddits, and for each subreddit individually:

- **Raw totals**: posts, comments, upvotes for the timeframe
- **Adjusted totals**: the same, after removing any excluded posts
- A list of which posts were excluded and which keyword matched
- Top 5 posts by upvotes and top 5 by comments

## How it works

- By default, launches headless Chromium and loads
  `https://www.reddit.com/r/<subreddit>/new/`. Reddit's current site renders
  each post as a `<shreddit-post>` custom element carrying its title, score,
  comment count, and timestamp as HTML attributes; the crawler reads those
  directly rather than parsing displayed/rounded text. New posts load via
  infinite scroll, so the crawler scrolls to the bottom repeatedly, collecting
  newly-appeared posts each time, until it passes the requested timeframe or
  the feed stops loading more. Stickied/pinned posts are ignored for that
  cutoff check, since Reddit shows them out of chronological order.
- Only counts a post's current `score` (net upvotes) and comment count —
  Reddit doesn't expose separate upvote/downvote counts or a historical
  comment-count-over-time breakdown to visitors.

### Optional: official API mode

If you pass `--client-id`/`--client-secret` (from a free Reddit "script" app,
see <https://www.reddit.com/prefs/apps> → "create another app..." → type
**script**), the crawler uses Reddit's official OAuth API instead
(`oauth.reddit.com`) rather than a browser. This used to be documented as the
recommended path, but Reddit's app-creation page's reCAPTCHA has been
unreliable for some users, so browser mode is the default again; use this
only if you already have working credentials.

## Notes / limitations

- **Reddit's page structure isn't verifiable from this tool's build
  environment** (a sandboxed session with no network access to reddit.com),
  so the `<shreddit-post>` attribute names extraction relies on
  (`post-title`, `score`, `comment-count`, `created-timestamp`, `permalink`,
  `stickied`, etc.) are the best available guess, not confirmed against a
  live page. **On every run**, the crawler saves a sample of the first few
  raw posts it found to `debug/<subreddit>-sample.json`, plus
  `debug/<subreddit>.html` and `.png` — if the reported numbers look wrong
  (zero, or clearly off), send those files over so extraction can be
  corrected against real attribute names instead of guesses.
- Very high-volume subreddits may have more posts in the requested window
  than `maxPages` scroll batches cover; increase `--max-pages` if the
  reported post count looks truncated (the CLI logs how many posts it found
  per subreddit, and warns if it found zero).
- If Reddit ever puts the same login-wall on www.reddit.com that it put on
  old.reddit.com, the crawler detects the redirect and fails with a clear
  error rather than silently reporting all zeros.
- This tool was built and unit-tested (including DOM extraction against a
  realistic HTML fixture, offline) in a sandboxed environment with no
  network access to reddit.com — it has not been run against live Reddit
  data. Run it somewhere with normal internet access and send the debug
  files from the first run so anything wrong can be fixed in one pass.

## Tests

```bash
cd reddit-analytics
npm test
```

Covers report aggregation/exclusion logic, OAuth API pagination/cutoff logic
(fake `fetch`), and the browser-based DOM extraction logic (a real headless
browser loading a local HTML fixture) — all fully offline, no calls to
reddit.com.

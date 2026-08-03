#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fetchSubredditPosts, getAccessToken } from './lib/reddit-client.mjs';
import { buildReport, formatMarkdown } from './lib/report.mjs';

const DEFAULT_USER_AGENT = 'subreddit-analytics-crawler/1.0 (personal use script)';

function parseArgs(argv) {
  const args = {
    subreddits: [],
    days: 7,
    exclude: [],
    maxPages: 10,
    out: null,
    json: false,
    userAgent: process.env.REDDIT_USER_AGENT || DEFAULT_USER_AGENT,
    clientId: process.env.REDDIT_CLIENT_ID || null,
    clientSecret: process.env.REDDIT_CLIENT_SECRET || null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => argv[++i];

    switch (arg) {
      case '--subreddits':
      case '-s':
        args.subreddits = next()
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      case '--days':
      case '-d':
        args.days = Number(next());
        break;
      case '--exclude':
      case '-x':
        args.exclude = next()
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      case '--max-pages':
        args.maxPages = Number(next());
        break;
      case '--out':
      case '-o':
        args.out = next();
        break;
      case '--json':
        args.json = true;
        break;
      case '--user-agent':
        args.userAgent = next();
        break;
      case '--client-id':
        args.clientId = next();
        break;
      case '--client-secret':
        args.clientSecret = next();
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Subreddit Analytics Crawler

Usage:
  node crawler.mjs --subreddits <sub1,sub2,sub3> --days <n> [options]

Options:
  -s, --subreddits <list>   Comma-separated subreddit names (max 3 recommended), no "r/" prefix
  -d, --days <n>            Timeframe in days to look back (default: 7)
  -x, --exclude <list>      Comma-separated title substrings to exclude from totals (case-insensitive)
      --max-pages <n>       Max pages of 100 posts to fetch per subreddit (default: 10)
  -o, --out <path>          Write the markdown report to this file (also prints to stdout)
      --json                Also write a .json file alongside the markdown report
      --user-agent <str>    Custom User-Agent header (Reddit requires a descriptive one)
      --client-id <str>     Reddit "script" app client id (or set REDDIT_CLIENT_ID) - see README.md
      --client-secret <str> Reddit "script" app client secret (or set REDDIT_CLIENT_SECRET)
  -h, --help                Show this help text

Reddit now blocks most unauthenticated JSON requests, so --client-id/--client-secret
(free, from https://www.reddit.com/prefs/apps) are required for reliable results.

Examples:
  node crawler.mjs -s webdev,programming -d 7
  node crawler.mjs -s webdev -d 30 -x "Giveaway,Mod Announcement" -o reports/webdev.md
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || args.subreddits.length === 0) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  if (args.subreddits.length > 3) {
    console.warn(`Warning: ${args.subreddits.length} subreddits requested; this may be slow and hit Reddit's rate limits.`);
  }

  if (!Number.isFinite(args.days) || args.days <= 0) {
    throw new Error(`--days must be a positive number, got: ${args.days}`);
  }

  const sinceUtc = Math.floor(Date.now() / 1000) - args.days * 86400;

  let accessToken = null;
  if (args.clientId && args.clientSecret) {
    console.error('Authenticating with Reddit...');
    accessToken = await getAccessToken({
      clientId: args.clientId,
      clientSecret: args.clientSecret,
      userAgent: args.userAgent,
    });
  } else {
    console.warn(
      'Warning: no --client-id/--client-secret provided; Reddit likely returns 403 for unauthenticated ' +
        'requests. See README.md for how to create a free "script" app.'
    );
  }

  const subredditResults = [];
  for (const subreddit of args.subreddits) {
    console.error(`Fetching r/${subreddit} (last ${args.days}d)...`);
    const allPosts = await fetchSubredditPosts(subreddit, {
      sinceUtc,
      userAgent: args.userAgent,
      accessToken,
      maxPages: args.maxPages,
    });
    console.error(`  -> ${allPosts.length} posts found`);
    subredditResults.push({ subreddit, allPosts });
  }

  const report = buildReport({ subredditResults, days: args.days, excludeKeywords: args.exclude });
  const markdown = formatMarkdown(report);

  console.log(markdown);

  if (args.out) {
    await mkdir(path.dirname(args.out), { recursive: true });
    await writeFile(args.out, markdown, 'utf8');
    console.error(`\nSaved report to ${args.out}`);

    if (args.json) {
      const jsonPath = args.out.replace(/\.md$/, '') + '.json';
      await writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf8');
      console.error(`Saved raw data to ${jsonPath}`);
    }
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  // Set exitCode rather than calling process.exit() directly: forcing an
  // immediate exit while fetch's underlying sockets are still being torn
  // down can crash Node on Windows (UV_HANDLE_CLOSING assertion in libuv).
  process.exitCode = 1;
});

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OLD_REDDIT_BASE = 'https://old.reddit.com';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Launches a real (headless) Chromium browser to fetch Reddit pages like a
 * normal visitor, avoiding the anti-bot blocking that Reddit's JSON API now
 * applies to plain HTTP clients. No Reddit account or API credentials needed.
 */
export async function launchBrowser({ executablePath, headless = true } = {}) {
  const options = { headless };
  if (executablePath) options.executablePath = executablePath;
  return chromium.launch(options);
}

export function parseScore(scoreTitle, scoreText) {
  if (scoreTitle != null && /^-?\d+$/.test(String(scoreTitle).trim())) {
    return parseInt(scoreTitle, 10);
  }
  if (!scoreText) return 0;
  const t = String(scoreText).trim().toLowerCase();
  if (t === '' || t === '•' || t === '-') return 0;

  const m = t.match(/^(-?\d+(?:\.\d+)?)([km]?)$/);
  if (!m) {
    const digits = t.replace(/[^0-9-]/g, '');
    return digits ? parseInt(digits, 10) : 0;
  }
  let value = parseFloat(m[1]);
  if (m[2] === 'k') value *= 1000;
  if (m[2] === 'm') value *= 1000000;
  return Math.round(value);
}

export function parseComments(commentsText) {
  if (!commentsText) return 0;
  const match = String(commentsText).replace(/,/g, '').match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export function normalizePost(raw, subreddit) {
  const timestampMs = raw.timestampMs != null ? Number(raw.timestampMs) : null;
  return {
    id: raw.fullname ? String(raw.fullname).replace(/^t3_/, '') : raw.permalink,
    subreddit,
    title: raw.title || '',
    author: raw.author || '[unknown]',
    createdUtc: timestampMs != null && !Number.isNaN(timestampMs) ? Math.floor(timestampMs / 1000) : null,
    createdIso: timestampMs != null && !Number.isNaN(timestampMs) ? new Date(timestampMs).toISOString() : null,
    numComments: parseComments(raw.commentsText),
    score: parseScore(raw.scoreTitle, raw.scoreText),
    upvoteRatio: null,
    permalink: raw.permalink ? `https://www.reddit.com${raw.permalink}` : null,
    stickied: !!raw.stickied,
  };
}

/**
 * Reads post data directly out of an already-loaded old.reddit.com listing
 * page's DOM. Kept separate from navigation so it can be unit tested with
 * page.setContent() against a fixture, with no network access required.
 */
export async function extractPostsFromPage(page) {
  const rawPosts = await page.evaluate(() => {
    const things = Array.from(document.querySelectorAll('#siteTable .thing'));
    return things.map((el) => {
      const titleEl = el.querySelector('a.title');
      const scoreEl = el.querySelector('.score.unvoted');
      const commentsEl = el.querySelector('a.comments');
      return {
        fullname: el.getAttribute('data-fullname'),
        permalink: el.getAttribute('data-permalink'),
        author: el.getAttribute('data-author'),
        timestampMs: el.getAttribute('data-timestamp'),
        stickied: el.classList.contains('stickied'),
        promoted: el.classList.contains('promoted'),
        title: titleEl ? titleEl.textContent.trim() : '',
        scoreTitle: scoreEl ? scoreEl.getAttribute('title') : null,
        scoreText: scoreEl ? scoreEl.textContent.trim() : null,
        commentsText: commentsEl ? commentsEl.textContent.trim() : null,
      };
    });
  });

  const nextHref = await page.evaluate(() => {
    const next =
      document.querySelector('a[rel~="next"]') || document.querySelector('.next-button a');
    return next ? next.getAttribute('href') : null;
  });

  return { rawPosts: rawPosts.filter((p) => !p.promoted), nextHref };
}

async function saveDebugArtifacts(page, debugDir, subreddit) {
  try {
    await mkdir(debugDir, { recursive: true });
    const htmlPath = path.join(debugDir, `${subreddit}.html`);
    const pngPath = path.join(debugDir, `${subreddit}.png`);
    await writeFile(htmlPath, await page.content(), 'utf8');
    await page.screenshot({ path: pngPath, fullPage: true });
    console.error(`  Debug: saved ${htmlPath} and ${pngPath} - send these if the post count looks wrong`);
  } catch (err) {
    console.error(`  Debug: failed to save diagnostics for r/${subreddit}: ${err.message}`);
  }
}

async function isBlockedPage(page) {
  return page.evaluate(() => {
    const text = (document.body?.textContent || '').toLowerCase();
    const title = (document.title || '').toLowerCase();
    return (
      title.includes('blocked') ||
      text.includes('you have been blocked') ||
      text.includes('whoa there') ||
      text.includes('network security') ||
      text.includes('please verify you are a human') ||
      text.includes("we're sorry, but you'll have to verify")
    );
  });
}

/**
 * Pages through r/<subreddit>/new on old.reddit.com collecting posts newer
 * than sinceUtc. Stickied posts never trigger the "older than window" stop
 * condition, since Reddit pins them out of chronological order.
 */
export async function fetchSubredditPostsViaBrowser(
  subreddit,
  {
    sinceUtc,
    browser,
    maxPages = 10,
    pageDelayMs = 1500,
    navTimeoutMs = 30000,
    userAgent = DEFAULT_USER_AGENT,
    debugDir = null,
  }
) {
  const context = await browser.newContext({ userAgent, viewport: { width: 1280, height: 1600 } });
  const page = await context.newPage();

  const posts = [];
  let url = `${OLD_REDDIT_BASE}/r/${subreddit}/new/`;
  let pageCount = 0;

  try {
    while (url && pageCount < maxPages) {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: navTimeoutMs });
      if (!response || !response.ok()) {
        throw new Error(`Failed to load ${url}: HTTP ${response ? response.status() : 'no response'}`);
      }
      if (page.url() !== url) {
        console.error(`  Note: r/${subreddit} request redirected to ${page.url()}`);
      }
      if (await isBlockedPage(page)) {
        throw new Error(`Reddit showed an anti-bot block page for r/${subreddit} (${url})`);
      }

      const { rawPosts, nextHref } = await extractPostsFromPage(page);
      if (rawPosts.length === 0) {
        if (debugDir) await saveDebugArtifacts(page, debugDir, subreddit);
        break;
      }

      let sawPostOlderThanWindow = false;
      for (const raw of rawPosts) {
        const createdUtc = raw.timestampMs ? Math.floor(Number(raw.timestampMs) / 1000) : null;
        if (createdUtc !== null && createdUtc < sinceUtc) {
          if (!raw.stickied) sawPostOlderThanWindow = true;
          continue;
        }
        posts.push(normalizePost(raw, subreddit));
      }

      pageCount += 1;
      url = nextHref ? new URL(nextHref, OLD_REDDIT_BASE).toString() : null;

      if (!url || sawPostOlderThanWindow) break;
      if (pageCount < maxPages) await new Promise((resolve) => setTimeout(resolve, pageDelayMs));
    }
  } finally {
    await context.close();
  }

  return posts;
}

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const REDDIT_BASE = 'https://www.reddit.com';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Launches a real (headless) Chromium browser to fetch Reddit pages like a
 * normal visitor. No Reddit account or API credentials needed.
 */
export async function launchBrowser({ executablePath, headless = true } = {}) {
  const options = { headless };
  if (executablePath) options.executablePath = executablePath;
  return chromium.launch(options);
}

export function isLoginRedirect(finalUrl) {
  try {
    return new URL(finalUrl).pathname.startsWith('/login');
  } catch {
    return false;
  }
}

export function parseScore(value) {
  if (value == null) return 0;
  const s = String(value).trim().toLowerCase();
  if (s === '' || s === '•' || s === '-') return 0;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);

  const m = s.match(/^(-?\d+(?:\.\d+)?)([km]?)$/);
  if (!m) {
    const digits = s.replace(/[^0-9-]/g, '');
    return digits ? parseInt(digits, 10) : 0;
  }
  let num = parseFloat(m[1]);
  if (m[2] === 'k') num *= 1000;
  if (m[2] === 'm') num *= 1000000;
  return Math.round(num);
}

export function parseComments(value) {
  return parseScore(value);
}

export function parseCreatedUtc(createdRaw) {
  if (!createdRaw) return null;
  const ms = Date.parse(createdRaw);
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
}

function isStickiedAttrs(attrs) {
  return attrs.stickied === 'true' || attrs['is-stickied'] === 'true' || attrs.pinned === 'true';
}

/**
 * Converts the raw attribute bag read off a <shreddit-post> element into
 * the crawler's standard post shape. A handful of candidate attribute names
 * are tried per field since Reddit's exact naming isn't verifiable from a
 * network-isolated sandbox - if these are wrong, debug/<subreddit>-sample.json
 * (saved by fetchSubredditPostsViaBrowser) shows the real attribute names.
 */
export function normalizePost(attrs, subreddit) {
  const idSource = attrs.id || attrs['post-id'] || attrs.permalink;
  const createdRaw = attrs['created-timestamp'] || attrs.created || attrs.timestamp;
  const createdUtc = parseCreatedUtc(createdRaw);
  const permalinkRaw = attrs.permalink || attrs['content-href'] || null;

  return {
    id: idSource ? String(idSource).replace(/^t3_/, '') : null,
    subreddit,
    title: attrs['post-title'] || attrs.title || '',
    author: attrs.author || '[unknown]',
    createdUtc,
    createdIso: createdUtc != null ? new Date(createdUtc * 1000).toISOString() : null,
    numComments: parseComments(attrs['comment-count'] ?? attrs['comments-count']),
    score: parseScore(attrs.score ?? attrs['score-value']),
    upvoteRatio: null,
    permalink: permalinkRaw
      ? permalinkRaw.startsWith('http')
        ? permalinkRaw
        : `${REDDIT_BASE}${permalinkRaw}`
      : null,
    stickied: isStickiedAttrs(attrs),
  };
}

/**
 * Reads the raw attribute bag off every <shreddit-post> element currently in
 * the DOM. Kept separate from navigation/scrolling so it can be unit tested
 * with page.setContent() against a fixture, with no network access required.
 */
export async function extractPostsFromPage(page) {
  return page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('shreddit-post'));
    return els.map((el) => {
      const attrs = {};
      for (const name of el.getAttributeNames()) attrs[name] = el.getAttribute(name);
      return attrs;
    });
  });
}

async function saveDebugArtifacts(page, debugDir, subreddit, sampleAttrs) {
  try {
    await mkdir(debugDir, { recursive: true });
    const htmlPath = path.join(debugDir, `${subreddit}.html`);
    const pngPath = path.join(debugDir, `${subreddit}.png`);
    const jsonPath = path.join(debugDir, `${subreddit}-sample.json`);
    await writeFile(htmlPath, await page.content(), 'utf8');
    await page.screenshot({ path: pngPath, fullPage: true });
    if (sampleAttrs) await writeFile(jsonPath, JSON.stringify(sampleAttrs, null, 2), 'utf8');
    console.error(
      `  Debug: saved ${htmlPath}, ${pngPath}${sampleAttrs ? `, and ${jsonPath}` : ''} - send these if the numbers look wrong`
    );
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
 * Loads r/<subreddit>/new on www.reddit.com and scrolls to trigger its
 * infinite-scroll loading, collecting posts newer than sinceUtc. Stickied
 * posts never trigger the "reached the cutoff" stop condition, since Reddit
 * shows them out of chronological order.
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
  const context = await browser.newContext({ userAgent, viewport: { width: 1280, height: 2000 } });
  const page = await context.newPage();
  const url = `${REDDIT_BASE}/r/${subreddit}/new/`;

  const seen = new Map();
  let noNewStreak = 0;

  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: navTimeoutMs });
    if (!response || !response.ok()) {
      throw new Error(`Failed to load ${url}: HTTP ${response ? response.status() : 'no response'}`);
    }
    if (isLoginRedirect(page.url())) {
      throw new Error(
        `Reddit redirected r/${subreddit} to a login page (${page.url()}). Anonymous access may be blocked ` +
          'for this subreddit or site-wide.'
      );
    }
    if (await isBlockedPage(page)) {
      throw new Error(`Reddit showed an anti-bot block page for r/${subreddit} (${url})`);
    }

    // <shreddit-post> elements hydrate shortly after the initial HTML loads.
    await page.waitForSelector('shreddit-post', { timeout: 10000 }).catch(() => {});

    for (let attempt = 0; attempt < maxPages; attempt += 1) {
      const rawPosts = await extractPostsFromPage(page);

      if (attempt === 0 && debugDir) {
        await saveDebugArtifacts(page, debugDir, subreddit, rawPosts.slice(0, 3));
      }
      if (attempt === 0 && rawPosts.length === 0) break;

      let addedNew = false;
      let sawOld = false;

      for (const attrs of rawPosts) {
        const idSource = attrs.id || attrs['post-id'] || attrs.permalink;
        if (!idSource || seen.has(idSource)) continue;
        addedNew = true;

        const createdUtc = parseCreatedUtc(attrs['created-timestamp'] || attrs.created || attrs.timestamp);
        const stickied = isStickiedAttrs(attrs);
        if (createdUtc !== null && createdUtc < sinceUtc && !stickied) {
          sawOld = true;
          seen.set(idSource, null);
          continue;
        }
        seen.set(idSource, normalizePost(attrs, subreddit));
      }

      if (sawOld) break;

      if (!addedNew) {
        noNewStreak += 1;
        if (noNewStreak >= 2) break; // likely reached the end of the feed
      } else {
        noNewStreak = 0;
      }

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise((resolve) => setTimeout(resolve, pageDelayMs));
    }
  } finally {
    await context.close();
  }

  return [...seen.values()].filter(Boolean);
}

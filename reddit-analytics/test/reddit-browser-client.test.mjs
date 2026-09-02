import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import {
  extractPostsFromPage,
  normalizePost,
  parseScore,
  parseComments,
  parseCreatedUtc,
  isLoginRedirect,
} from '../lib/reddit-browser-client.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// This sandbox's pre-installed Chromium build doesn't match the exact
// revision the installed `playwright` npm package expects by default, so
// tests point at the stable "chromium" symlink some environments provide.
// A plain `chromium.launch()` (no executablePath) is what real usage does.
const TEST_EXECUTABLE_PATH = process.env.PLAYWRIGHT_TEST_EXECUTABLE || undefined;

async function withFixturePage(run) {
  const browser = await chromium.launch({ headless: true, executablePath: TEST_EXECUTABLE_PATH });
  try {
    const page = await browser.newPage();
    const html = await readFile(path.join(__dirname, 'fixtures/shreddit-listing.html'), 'utf8');
    await page.setContent(html);
    await run(page);
  } finally {
    await browser.close();
  }
}

test('parseScore/parseComments handle plain integers and abbreviated strings', () => {
  assert.equal(parseScore('2317'), 2317);
  assert.equal(parseScore('2.3k'), 2300);
  assert.equal(parseScore('1.5m'), 1500000);
  assert.equal(parseScore('0'), 0);
  assert.equal(parseScore(null), 0);
  assert.equal(parseComments('142'), 142);
  assert.equal(parseComments(undefined), 0);
});

test('parseCreatedUtc parses an ISO timestamp into unix seconds', () => {
  assert.equal(parseCreatedUtc('2023-11-14T22:15:00.000+0000'), 1700000100);
  assert.equal(parseCreatedUtc(null), null);
  assert.equal(parseCreatedUtc('not a date'), null);
});

test('isLoginRedirect detects Reddit login-wall redirects', () => {
  assert.equal(
    isLoginRedirect('https://www.reddit.com/login/?reason=lor2&dest=https%3A%2F%2Fwww.reddit.com%2Fr%2Ftest%2Fnew%2F'),
    true
  );
  assert.equal(isLoginRedirect('https://www.reddit.com/r/test/new/'), false);
  assert.equal(isLoginRedirect('not a url'), false);
});

test('normalizePost converts a raw <shreddit-post> attribute bag into the standard post shape', () => {
  const post = normalizePost(
    {
      id: 't3_new1',
      author: 'builder99',
      'post-title': 'How I built a SaaS in 30 days',
      score: '2317',
      'comment-count': '142',
      'created-timestamp': '2023-11-14T22:15:00.000+0000',
      permalink: '/r/testsubreddit/comments/new1/how_i_built_a_saas/',
      stickied: 'false',
    },
    'testsubreddit'
  );

  assert.equal(post.id, 'new1');
  assert.equal(post.subreddit, 'testsubreddit');
  assert.equal(post.title, 'How I built a SaaS in 30 days');
  assert.equal(post.score, 2317);
  assert.equal(post.numComments, 142);
  assert.equal(post.createdUtc, 1700000100);
  assert.equal(post.permalink, 'https://www.reddit.com/r/testsubreddit/comments/new1/how_i_built_a_saas/');
  assert.equal(post.stickied, false);
});

test('extractPostsFromPage reads every <shreddit-post> attribute bag from a fixture page', async () => {
  await withFixturePage(async (page) => {
    const rawPosts = await extractPostsFromPage(page);

    assert.deepEqual(
      rawPosts.map((p) => p.id),
      ['t3_sticky1', 't3_new1', 't3_new2', 't3_new3', 't3_zero']
    );

    const sticky = rawPosts.find((p) => p.id === 't3_sticky1');
    assert.equal(sticky.stickied, 'true');

    const newest = rawPosts.find((p) => p.id === 't3_new1');
    assert.equal(newest['post-title'], 'How I built a SaaS in 30 days');
    assert.equal(newest.score, '2317');
    assert.equal(newest['comment-count'], '142');
  });
});

test('extractPostsFromPage + normalizePost end-to-end matches expected totals', async () => {
  await withFixturePage(async (page) => {
    const rawPosts = await extractPostsFromPage(page);
    const posts = rawPosts.map((attrs) => normalizePost(attrs, 'testsubreddit'));

    const byId = Object.fromEntries(posts.map((p) => [p.id, p]));
    assert.equal(byId.new1.score, 2317);
    assert.equal(byId.new1.numComments, 142);
    assert.equal(byId.new2.title, 'Weekly Giveaway - win a free course!');
    assert.equal(byId.zero.score, 0);
    assert.equal(byId.sticky1.stickied, true);
  });
});

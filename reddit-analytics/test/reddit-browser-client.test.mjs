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
    const html = await readFile(path.join(__dirname, 'fixtures/old-reddit-listing.html'), 'utf8');
    await page.setContent(html);
    await run(page);
  } finally {
    await browser.close();
  }
}

test('parseScore prefers the exact title attribute over abbreviated text', () => {
  assert.equal(parseScore('2317', '2.3k'), 2317);
  assert.equal(parseScore(null, '2.3k'), 2300);
  assert.equal(parseScore(null, '1.5m'), 1500000);
  assert.equal(parseScore(null, '95'), 95);
  assert.equal(parseScore('•', '•'), 0);
  assert.equal(parseScore(null, null), 0);
});

test('isLoginRedirect detects Reddit login-wall redirects', () => {
  assert.equal(
    isLoginRedirect('https://old.reddit.com/login/?reason=lor2&dest=https%3A%2F%2Fold.reddit.com%2Fr%2Ftest%2Fnew%2F'),
    true
  );
  assert.equal(isLoginRedirect('https://old.reddit.com/r/test/new/'), false);
  assert.equal(isLoginRedirect('not a url'), false);
});

test('parseComments extracts the leading integer', () => {
  assert.equal(parseComments('142 comments'), 142);
  assert.equal(parseComments('1 comment'), 1);
  assert.equal(parseComments('0 comments'), 0);
  assert.equal(parseComments(null), 0);
});

test('normalizePost converts raw DOM data into the standard post shape', () => {
  const post = normalizePost(
    {
      fullname: 't3_new1',
      permalink: '/r/testsubreddit/comments/new1/how_i_built_a_saas/',
      author: 'builder99',
      timestampMs: '1700000900000',
      stickied: false,
      title: 'How I built a SaaS in 30 days',
      scoreTitle: '2317',
      scoreText: '2.3k',
      commentsText: '142 comments',
    },
    'testsubreddit'
  );

  assert.equal(post.id, 'new1');
  assert.equal(post.subreddit, 'testsubreddit');
  assert.equal(post.title, 'How I built a SaaS in 30 days');
  assert.equal(post.score, 2317);
  assert.equal(post.numComments, 142);
  assert.equal(post.createdUtc, 1700000900);
  assert.equal(post.permalink, 'https://www.reddit.com/r/testsubreddit/comments/new1/how_i_built_a_saas/');
});

test('extractPostsFromPage reads posts from a fixture old.reddit.com listing page, skipping promoted posts', async () => {
  await withFixturePage(async (page) => {
    const { rawPosts, nextHref } = await extractPostsFromPage(page);

    assert.deepEqual(
      rawPosts.map((p) => p.fullname),
      ['t3_sticky1', 't3_new1', 't3_new2', 't3_new3', 't3_zero']
    );

    const promoted = rawPosts.find((p) => p.title.includes('Promoted'));
    assert.equal(promoted, undefined, 'promoted posts should be filtered out');

    const sticky = rawPosts.find((p) => p.fullname === 't3_sticky1');
    assert.equal(sticky.stickied, true);

    const zeroVotes = rawPosts.find((p) => p.fullname === 't3_zero');
    assert.equal(zeroVotes.scoreText, '•');

    assert.equal(nextHref, '/r/testsubreddit/new/?count=25&after=t3_zero');
  });
});

test('extractPostsFromPage + normalizePost end-to-end matches expected totals', async () => {
  await withFixturePage(async (page) => {
    const { rawPosts } = await extractPostsFromPage(page);
    const posts = rawPosts.map((p) => normalizePost(p, 'testsubreddit'));

    const byId = Object.fromEntries(posts.map((p) => [p.id, p]));
    assert.equal(byId.new1.score, 2317);
    assert.equal(byId.new1.numComments, 142);
    assert.equal(byId.new2.title, 'Weekly Giveaway - win a free course!');
    assert.equal(byId.zero.score, 0);
    assert.equal(byId.sticky1.stickied, true);
  });
});

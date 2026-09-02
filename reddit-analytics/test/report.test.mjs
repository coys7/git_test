import test from 'node:test';
import assert from 'node:assert/strict';
import { filterPosts, summarize, buildReport } from '../lib/report.mjs';

function makePost(overrides = {}) {
  return {
    id: 'abc123',
    subreddit: 'testsubreddit',
    title: 'Some post title',
    author: 'someuser',
    createdUtc: 1700000000,
    createdIso: '2023-11-14T22:13:20.000Z',
    numComments: 10,
    score: 100,
    upvoteRatio: 0.9,
    permalink: 'https://www.reddit.com/r/testsubreddit/comments/abc123/',
    stickied: false,
    ...overrides,
  };
}

test('summarize totals posts, comments, and upvotes', () => {
  const posts = [
    makePost({ numComments: 5, score: 50 }),
    makePost({ numComments: 15, score: 150 }),
  ];
  const summary = summarize(posts);
  assert.equal(summary.totalPosts, 2);
  assert.equal(summary.totalComments, 20);
  assert.equal(summary.totalUpvotes, 200);
  assert.equal(summary.avgCommentsPerPost, 10);
  assert.equal(summary.avgUpvotesPerPost, 100);
});

test('summarize handles an empty post list', () => {
  const summary = summarize([]);
  assert.equal(summary.totalPosts, 0);
  assert.equal(summary.totalComments, 0);
  assert.equal(summary.totalUpvotes, 0);
});

test('filterPosts excludes posts whose title contains a keyword, case-insensitively', () => {
  const posts = [
    makePost({ id: '1', title: 'Weekly Giveaway - win a prize!', numComments: 40, score: 400 }),
    makePost({ id: '2', title: 'A normal discussion post', numComments: 5, score: 50 }),
    makePost({ id: '3', title: 'ANOTHER giveaway thread', numComments: 8, score: 80 }),
  ];

  const { kept, excluded } = filterPosts(posts, { excludeKeywords: ['Giveaway'] });

  assert.equal(kept.length, 1);
  assert.equal(kept[0].id, '2');
  assert.equal(excluded.length, 2);
  assert.deepEqual(excluded.map((p) => p.id).sort(), ['1', '3']);
  assert.equal(excluded[0].matchedKeyword, 'giveaway');
});

test('filterPosts with no exclude keywords keeps everything', () => {
  const posts = [makePost({ id: '1' }), makePost({ id: '2' })];
  const { kept, excluded } = filterPosts(posts, { excludeKeywords: [] });
  assert.equal(kept.length, 2);
  assert.equal(excluded.length, 0);
});

test('buildReport produces raw and adjusted totals per subreddit and combined', () => {
  const subredditResults = [
    {
      subreddit: 'alpha',
      allPosts: [
        makePost({ id: 'a1', subreddit: 'alpha', title: 'Giveaway time', numComments: 20, score: 200 }),
        makePost({ id: 'a2', subreddit: 'alpha', title: 'Regular post', numComments: 5, score: 50 }),
      ],
    },
    {
      subreddit: 'beta',
      allPosts: [
        makePost({ id: 'b1', subreddit: 'beta', title: 'Another regular post', numComments: 3, score: 30 }),
      ],
    },
  ];

  const report = buildReport({ subredditResults, days: 7, excludeKeywords: ['Giveaway'] });

  const alpha = report.perSubreddit.find((r) => r.subreddit === 'alpha');
  assert.equal(alpha.rawSummary.totalPosts, 2);
  assert.equal(alpha.rawSummary.totalComments, 25);
  assert.equal(alpha.rawSummary.totalUpvotes, 250);
  assert.equal(alpha.adjustedSummary.totalPosts, 1);
  assert.equal(alpha.adjustedSummary.totalComments, 5);
  assert.equal(alpha.adjustedSummary.totalUpvotes, 50);
  assert.equal(alpha.excludedPosts.length, 1);

  assert.equal(report.combined.rawSummary.totalPosts, 3);
  assert.equal(report.combined.rawSummary.totalComments, 28);
  assert.equal(report.combined.rawSummary.totalUpvotes, 280);
  assert.equal(report.combined.adjustedSummary.totalPosts, 2);
  assert.equal(report.combined.adjustedSummary.totalComments, 8);
  assert.equal(report.combined.adjustedSummary.totalUpvotes, 80);
  assert.equal(report.combined.excludedPosts.length, 1);
});

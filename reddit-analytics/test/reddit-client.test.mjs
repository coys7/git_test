import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchSubredditPosts, getAccessToken } from '../lib/reddit-client.mjs';

function rawPost(overrides = {}) {
  return {
    id: 'p1',
    title: 'A post',
    author: 'user1',
    created_utc: 1000,
    num_comments: 1,
    score: 1,
    upvote_ratio: 1,
    permalink: '/r/test/comments/p1/',
    stickied: false,
    ...overrides,
  };
}

function listingResponse(posts, after) {
  return {
    data: {
      after,
      children: posts.map((data) => ({ data })),
    },
  };
}

test('fetchSubredditPosts stops paginating once posts fall before the cutoff', async () => {
  const sinceUtc = 500;

  const page1 = listingResponse(
    [
      rawPost({ id: 'new1', created_utc: 900 }),
      rawPost({ id: 'new2', created_utc: 800 }),
    ],
    'cursor1'
  );
  const page2 = listingResponse(
    [
      rawPost({ id: 'new3', created_utc: 600 }),
      rawPost({ id: 'old1', created_utc: 100 }), // older than cutoff -> stops pagination
    ],
    'cursor2'
  );
  const page3 = listingResponse([rawPost({ id: 'never-fetched', created_utc: 900 })], null);

  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    const body = calls.length === 1 ? page1 : calls.length === 2 ? page2 : page3;
    return { ok: true, status: 200, json: async () => body };
  };

  const posts = await fetchSubredditPosts('test', { sinceUtc, userAgent: 'test-agent', fetchImpl, pageDelayMs: 0 });

  assert.deepEqual(
    posts.map((p) => p.id),
    ['new1', 'new2', 'new3']
  );
  assert.equal(calls.length, 2, 'should not fetch page 3 once an old post is seen');
});

test('fetchSubredditPosts ignores stickied posts when checking the cutoff', async () => {
  const sinceUtc = 500;

  const page1 = listingResponse(
    [
      rawPost({ id: 'sticky1', created_utc: 50, stickied: true }), // old but stickied, ignored for cutoff
      rawPost({ id: 'new1', created_utc: 900 }),
    ],
    null
  );

  const fetchImpl = async () => ({ ok: true, status: 200, json: async () => page1 });

  const posts = await fetchSubredditPosts('test', { sinceUtc, userAgent: 'test-agent', fetchImpl, pageDelayMs: 0 });

  assert.deepEqual(
    posts.map((p) => p.id),
    ['new1']
  );
});

test('fetchSubredditPosts retries on 429 then succeeds', async () => {
  const sinceUtc = 500;
  const page1 = listingResponse([rawPost({ id: 'new1', created_utc: 900 })], null);

  let attempts = 0;
  const fetchImpl = async () => {
    attempts += 1;
    if (attempts < 3) {
      return { ok: false, status: 429, statusText: 'Too Many Requests', json: async () => ({}) };
    }
    return { ok: true, status: 200, json: async () => page1 };
  };

  const posts = await fetchSubredditPosts('test', {
    sinceUtc,
    userAgent: 'test-agent',
    fetchImpl,
    pageDelayMs: 0,
    maxRetries: 3,
  });

  assert.equal(attempts, 3);
  assert.deepEqual(posts.map((p) => p.id), ['new1']);
});

test('fetchSubredditPosts throws on a non-retryable error status', async () => {
  const fetchImpl = async () => ({ ok: false, status: 404, statusText: 'Not Found', json: async () => ({}) });

  await assert.rejects(
    () => fetchSubredditPosts('doesnotexist', { sinceUtc: 0, userAgent: 'test-agent', fetchImpl, pageDelayMs: 0 }),
    /404/
  );
});

test('fetchSubredditPosts throws a helpful hint on 403 without an access token', async () => {
  const fetchImpl = async () => ({ ok: false, status: 403, statusText: 'Blocked', json: async () => ({}) });

  await assert.rejects(
    () => fetchSubredditPosts('test', { sinceUtc: 0, userAgent: 'test-agent', fetchImpl, pageDelayMs: 0 }),
    /client-id/
  );
});

test('fetchSubredditPosts hits oauth.reddit.com with a Bearer header when given an accessToken', async () => {
  const page1 = listingResponse([rawPost({ id: 'new1', created_utc: 900 })], null);

  let seenUrl;
  let seenHeaders;
  const fetchImpl = async (url, options) => {
    seenUrl = String(url);
    seenHeaders = options.headers;
    return { ok: true, status: 200, json: async () => page1 };
  };

  const posts = await fetchSubredditPosts('test', {
    sinceUtc: 500,
    userAgent: 'test-agent',
    accessToken: 'tok_abc123',
    fetchImpl,
    pageDelayMs: 0,
  });

  assert.equal(posts.length, 1);
  assert.match(seenUrl, /^https:\/\/oauth\.reddit\.com\/r\/test\/new\?/);
  assert.doesNotMatch(seenUrl, /\.json/);
  assert.equal(seenHeaders.Authorization, 'Bearer tok_abc123');
});

test('getAccessToken posts client_credentials with Basic auth and returns the token', async () => {
  let seenUrl;
  let seenOptions;
  const fetchImpl = async (url, options) => {
    seenUrl = String(url);
    seenOptions = options;
    return { ok: true, status: 200, json: async () => ({ access_token: 'tok_xyz', expires_in: 3600 }) };
  };

  const token = await getAccessToken({
    clientId: 'my-id',
    clientSecret: 'my-secret',
    userAgent: 'test-agent',
    fetchImpl,
  });

  assert.equal(token, 'tok_xyz');
  assert.equal(seenUrl, 'https://www.reddit.com/api/v1/access_token');
  assert.equal(seenOptions.method, 'POST');
  assert.equal(seenOptions.body, 'grant_type=client_credentials');
  assert.equal(
    seenOptions.headers.Authorization,
    `Basic ${Buffer.from('my-id:my-secret').toString('base64')}`
  );
});

test('getAccessToken throws when Reddit rejects the credentials', async () => {
  const fetchImpl = async () => ({ ok: false, status: 401, statusText: 'Unauthorized' });

  await assert.rejects(
    () => getAccessToken({ clientId: 'bad', clientSecret: 'bad', userAgent: 'test-agent', fetchImpl }),
    /401/
  );
});

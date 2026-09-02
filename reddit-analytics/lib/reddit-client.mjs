const PUBLIC_BASE = 'https://www.reddit.com';
const OAUTH_BASE = 'https://oauth.reddit.com';
const TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePost(post, subreddit) {
  return {
    id: post.id,
    subreddit,
    title: post.title,
    author: post.author,
    createdUtc: post.created_utc,
    createdIso: new Date(post.created_utc * 1000).toISOString(),
    numComments: post.num_comments ?? 0,
    score: post.score ?? 0,
    upvoteRatio: post.upvote_ratio ?? null,
    permalink: `https://www.reddit.com${post.permalink}`,
    stickied: !!post.stickied,
  };
}

/**
 * Exchanges a Reddit "script" app's client id/secret for an app-only OAuth
 * access token (client_credentials grant). Reddit now rejects unauthenticated
 * requests to its JSON listing endpoints with a 403, so this is required for
 * reliable access.
 */
export async function getAccessToken({ clientId, clientSecret, userAgent, fetchImpl = fetch }) {
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetchImpl(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': userAgent,
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new Error(`Failed to get Reddit access token: ${res.status} ${res.statusText}`);
  }

  const body = await res.json();
  if (!body.access_token) {
    throw new Error('Reddit token response did not include an access_token');
  }

  return body.access_token;
}

function buildListingUrl(base, subreddit, after) {
  const suffix = base === OAUTH_BASE ? '' : '.json';
  const url = new URL(`/r/${subreddit}/new${suffix}`, base);
  url.searchParams.set('limit', '100');
  url.searchParams.set('raw_json', '1');
  if (after) url.searchParams.set('after', after);
  return url;
}

/**
 * Pages through r/<subreddit>/new collecting posts newer than sinceUtc.
 * Stickied posts never trigger the "older than window" stop condition, since
 * Reddit pins them out of chronological order at the top of the listing.
 *
 * Pass an OAuth `accessToken` (see getAccessToken) to hit oauth.reddit.com;
 * without one this falls back to the unauthenticated www.reddit.com JSON
 * endpoint, which Reddit may reject with a 403.
 */
export async function fetchSubredditPosts(
  subreddit,
  {
    sinceUtc,
    userAgent,
    accessToken = null,
    maxPages = 10,
    pageDelayMs = 1100,
    fetchImpl = fetch,
    maxRetries = 3,
  }
) {
  const base = accessToken ? OAUTH_BASE : PUBLIC_BASE;
  const posts = [];
  let after = null;
  let page = 0;

  while (page < maxPages) {
    const url = buildListingUrl(base, subreddit, after);
    const body = await fetchWithRetry(url, userAgent, accessToken, fetchImpl, maxRetries);
    const children = body?.data?.children ?? [];
    if (children.length === 0) break;

    let sawPostOlderThanWindow = false;
    for (const { data: post } of children) {
      if (post.created_utc < sinceUtc) {
        if (!post.stickied) sawPostOlderThanWindow = true;
        continue;
      }
      posts.push(normalizePost(post, subreddit));
    }

    after = body?.data?.after ?? null;
    page += 1;

    if (!after || sawPostOlderThanWindow) break;
    if (page < maxPages) await sleep(pageDelayMs);
  }

  return posts;
}

async function fetchWithRetry(url, userAgent, accessToken, fetchImpl, maxRetries) {
  const headers = { 'User-Agent': userAgent };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    if (attempt > 0) await sleep(1500 * attempt);

    const res = await fetchImpl(url, { headers });

    if (res.status === 429 || res.status >= 500) {
      lastError = new Error(`Reddit API returned ${res.status} for ${url}`);
      continue;
    }
    if (!res.ok) {
      const hint =
        res.status === 403 && !accessToken
          ? ' (Reddit now blocks unauthenticated JSON requests for most clients — pass --client-id/--client-secret, see README.md)'
          : '';
      throw new Error(`Reddit API error for ${url}: ${res.status} ${res.statusText}${hint}`);
    }
    return res.json();
  }
  throw lastError ?? new Error(`Failed to fetch ${url}`);
}

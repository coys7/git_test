const REDDIT_BASE = 'https://www.reddit.com';

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
 * Pages through r/<subreddit>/new.json collecting posts newer than sinceUtc.
 * Stickied posts never trigger the "older than window" stop condition, since
 * Reddit pins them out of chronological order at the top of the listing.
 */
export async function fetchSubredditPosts(
  subreddit,
  {
    sinceUtc,
    userAgent,
    maxPages = 10,
    pageDelayMs = 1100,
    fetchImpl = fetch,
    maxRetries = 3,
  }
) {
  const posts = [];
  let after = null;
  let page = 0;

  while (page < maxPages) {
    const url = new URL(`/r/${subreddit}/new.json`, REDDIT_BASE);
    url.searchParams.set('limit', '100');
    url.searchParams.set('raw_json', '1');
    if (after) url.searchParams.set('after', after);

    const body = await fetchWithRetry(url, userAgent, fetchImpl, maxRetries);
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

async function fetchWithRetry(url, userAgent, fetchImpl, maxRetries) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    if (attempt > 0) await sleep(1500 * attempt);

    const res = await fetchImpl(url, { headers: { 'User-Agent': userAgent } });

    if (res.status === 429 || res.status >= 500) {
      lastError = new Error(`Reddit API returned ${res.status} for ${url}`);
      continue;
    }
    if (!res.ok) {
      throw new Error(`Reddit API error for ${url}: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }
  throw lastError ?? new Error(`Failed to fetch ${url}`);
}

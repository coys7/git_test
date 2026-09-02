export function filterPosts(posts, { excludeKeywords = [] } = {}) {
  const normalizedExcludes = excludeKeywords
    .map((k) => k.toLowerCase().trim())
    .filter(Boolean);

  const kept = [];
  const excluded = [];

  for (const post of posts) {
    const titleLower = post.title.toLowerCase();
    const matched = normalizedExcludes.find((kw) => titleLower.includes(kw));
    if (matched) {
      excluded.push({ ...post, matchedKeyword: matched });
    } else {
      kept.push(post);
    }
  }

  return { kept, excluded };
}

export function summarize(posts) {
  const totalPosts = posts.length;
  const totalComments = posts.reduce((sum, p) => sum + p.numComments, 0);
  const totalUpvotes = posts.reduce((sum, p) => sum + p.score, 0);

  return {
    totalPosts,
    totalComments,
    totalUpvotes,
    avgCommentsPerPost: totalPosts ? totalComments / totalPosts : 0,
    avgUpvotesPerPost: totalPosts ? totalUpvotes / totalPosts : 0,
  };
}

export function topPosts(posts, key, n = 5) {
  return [...posts].sort((a, b) => b[key] - a[key]).slice(0, n);
}

export function buildReport({ subredditResults, days, excludeKeywords = [] }) {
  const perSubreddit = subredditResults.map(({ subreddit, allPosts }) => {
    const { kept, excluded } = filterPosts(allPosts, { excludeKeywords });
    return {
      subreddit,
      rawSummary: summarize(allPosts),
      adjustedSummary: summarize(kept),
      excludedPosts: excluded,
      keptPosts: kept,
      topByUpvotes: topPosts(kept, 'score'),
      topByComments: topPosts(kept, 'numComments'),
    };
  });

  const allRawPosts = subredditResults.flatMap((r) => r.allPosts);
  const allKeptPosts = perSubreddit.flatMap((r) => r.keptPosts);
  const allExcludedPosts = perSubreddit.flatMap((r) => r.excludedPosts);

  return {
    days,
    excludeKeywords,
    generatedAt: new Date().toISOString(),
    perSubreddit,
    combined: {
      rawSummary: summarize(allRawPosts),
      adjustedSummary: summarize(allKeptPosts),
      excludedPosts: allExcludedPosts,
    },
  };
}

function fmtNum(n) {
  return n.toLocaleString('en-US');
}

function fmtAvg(n) {
  return n.toFixed(1);
}

function postLine(post) {
  return `- **${post.title}** — ${fmtNum(post.score)} upvotes, ${fmtNum(post.numComments)} comments ([link](${post.permalink}))`;
}

export function formatMarkdown(report) {
  const lines = [];
  const subredditLabel = report.perSubreddit.map((r) => `r/${r.subreddit}`).join(', ');

  lines.push(`# Subreddit Analytics Report`);
  lines.push('');
  lines.push(`- **Subreddits:** ${subredditLabel}`);
  lines.push(`- **Timeframe:** last ${report.days} day${report.days === 1 ? '' : 's'}`);
  lines.push(`- **Generated:** ${report.generatedAt}`);
  if (report.excludeKeywords.length) {
    lines.push(`- **Excluded keywords:** ${report.excludeKeywords.join(', ')}`);
  }
  lines.push('');

  lines.push(`## Combined Totals`);
  lines.push('');
  lines.push(`| Metric | Raw | Adjusted (after exclusions) |`);
  lines.push(`| --- | --- | --- |`);
  lines.push(
    `| Posts | ${fmtNum(report.combined.rawSummary.totalPosts)} | ${fmtNum(report.combined.adjustedSummary.totalPosts)} |`
  );
  lines.push(
    `| Comments | ${fmtNum(report.combined.rawSummary.totalComments)} | ${fmtNum(report.combined.adjustedSummary.totalComments)} |`
  );
  lines.push(
    `| Upvotes | ${fmtNum(report.combined.rawSummary.totalUpvotes)} | ${fmtNum(report.combined.adjustedSummary.totalUpvotes)} |`
  );
  lines.push('');

  for (const sub of report.perSubreddit) {
    lines.push(`## r/${sub.subreddit}`);
    lines.push('');
    lines.push(`| Metric | Raw | Adjusted |`);
    lines.push(`| --- | --- | --- |`);
    lines.push(`| Posts | ${fmtNum(sub.rawSummary.totalPosts)} | ${fmtNum(sub.adjustedSummary.totalPosts)} |`);
    lines.push(`| Comments | ${fmtNum(sub.rawSummary.totalComments)} | ${fmtNum(sub.adjustedSummary.totalComments)} |`);
    lines.push(`| Upvotes | ${fmtNum(sub.rawSummary.totalUpvotes)} | ${fmtNum(sub.adjustedSummary.totalUpvotes)} |`);
    lines.push(`| Avg comments/post | — | ${fmtAvg(sub.adjustedSummary.avgCommentsPerPost)} |`);
    lines.push(`| Avg upvotes/post | — | ${fmtAvg(sub.adjustedSummary.avgUpvotesPerPost)} |`);
    lines.push('');

    if (sub.excludedPosts.length) {
      lines.push(`**Excluded posts (${sub.excludedPosts.length}):**`);
      lines.push('');
      for (const post of sub.excludedPosts) {
        lines.push(`${postLine(post)} — matched \`"${post.matchedKeyword}"\``);
      }
      lines.push('');
    }

    if (sub.topByUpvotes.length) {
      lines.push(`**Top posts by upvotes:**`);
      lines.push('');
      for (const post of sub.topByUpvotes) lines.push(postLine(post));
      lines.push('');
    }

    if (sub.topByComments.length) {
      lines.push(`**Top posts by comments:**`);
      lines.push('');
      for (const post of sub.topByComments) lines.push(postLine(post));
      lines.push('');
    }
  }

  return lines.join('\n');
}

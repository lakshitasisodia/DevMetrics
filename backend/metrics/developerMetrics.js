

import {
  ensureArray,
  getCommitAuthorIdentity,
  roundNumber,
  safeDivide,
} from "./metricUtils.js";


export function getDeveloperIdentities(commits) {
  const developerMap = new Map();

  for (const commit of ensureArray(commits)) {
    const identity = getCommitAuthorIdentity(commit);

    if (!identity) {
      continue;
    }

    if (!developerMap.has(identity)) {
      developerMap.set(identity, {
        identity,
        commits: 0,
      });
    }

    developerMap.get(identity).commits += 1;
  }

  return developerMap;
}


export function calculateDeveloperCommitCounts(commits) {
  const developerMap =
    getDeveloperIdentities(commits);

  const result = {};

  for (const [identity, data] of developerMap) {
    result[identity] = data.commits;
  }

  return result;
}


export function calculateDeveloperContributions(commits) {
  const commitList = ensureArray(commits);

  const totalCommits = commitList.length;

  if (totalCommits === 0) {
    return {};
  }

  const developerMap =
    getDeveloperIdentities(commitList);

  const result = {}; 

  for (const [identity, data] of developerMap) {
    result[identity] = {
      commits: data.commits,

      percentage: roundNumber(
        safeDivide(
          data.commits,
          totalCommits
        ) * 100
      ),
    };
  }

  return result;
}

// ------------------------------------------------------
// DEVELOPER PR COUNTS
// ------------------------------------------------------
//
// Expected normalized PR data:
//
// [
//   {
//     author: {
//       login: "alice"
//     }
//   }
// ]
//
// GitHub PR author can be null, so invalid identities
// are ignored.
// ------------------------------------------------------

export function calculateDeveloperPRCounts(
  pullRequests
) {
  const result = {};

  for (const pr of ensureArray(pullRequests)) {
    const login = pr?.user?.login;

    if (
      typeof login !== "string" ||
      login.trim() === ""
    ) {
      continue;
    }

    const identity =
      `github:${login.trim().toLowerCase()}`;

    result[identity] =
      (result[identity] || 0) + 1;
  }

  return result;
}

// ------------------------------------------------------
// DEVELOPER REVIEW COUNTS
// ------------------------------------------------------
//
// Expected:
//
// [
//   {
//     reviews: [
//       {
//         user: { login: "alice" }
//       }
//     ]
//   }
// ]
// ------------------------------------------------------

export function calculateDeveloperReviewCounts(
  reviewData
) {
  const result = {};

  for (const group of ensureArray(reviewData)) {
    const reviews =
      ensureArray(group?.reviews);

    for (const review of reviews) {
      const login = review?.user?.login;

      if (
        typeof login !== "string" ||
        login.trim() === ""
      ) {
        continue;
      }

      const identity =
        `github:${login.trim().toLowerCase()}`;

      result[identity] =
        (result[identity] || 0) + 1;
    }
  }

  return result;
}

// ------------------------------------------------------
// DEVELOPER ISSUE COUNTS
// ------------------------------------------------------
//
// Expected issue:
//
// {
//   user: {
//     login: "alice"
//   }
// }
// ------------------------------------------------------

export function calculateDeveloperIssueCounts(
  issues
) {
  const result = {};

  for (const issue of ensureArray(issues)) {
    // Don't count PRs returned by Issues API.
    if (issue?.pull_request) {
      continue;
    }

    const login = issue?.user?.login;

    if (
      typeof login !== "string" ||
      login.trim() === ""
    ) {
      continue;
    }

    const identity =
      `github:${login.trim().toLowerCase()}`;

    result[identity] =
      (result[identity] || 0) + 1;
  }

  return result;
}

// ------------------------------------------------------
// COMPLETE DEVELOPER METRICS
// ------------------------------------------------------

export function calculateDeveloperMetrics({
  commits = [],
  pullRequests = [],
  reviewData = [],
  issues = [],
}) {
  return {
    commitCounts:
      calculateDeveloperCommitCounts(
        commits
      ),

    contributions:
      calculateDeveloperContributions(
        commits
      ),

    prCounts:
      calculateDeveloperPRCounts(
        pullRequests
      ),

    reviewCounts:
      calculateDeveloperReviewCounts(
        reviewData
      ),

    issueCounts:
      calculateDeveloperIssueCounts(
        issues
      ),
  };
}
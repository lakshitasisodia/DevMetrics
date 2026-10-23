
import {
  fetchPullRequests,
} from "../services/githubServices.js";

import {
  calculatePullRequestMetrics,
} from "../metrics/pullRequestMetrics.js";


export async function getPullRequestMetrics({
  user,
  repo,
  githubToken,
}) {
  const pullRequests =
    await fetchPullRequests(
      user,
      repo,
      githubToken
    );

  return calculatePullRequestMetrics(
    pullRequests
  );
}
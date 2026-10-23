
import {
  fetchCommits,
  fetchPullRequests,
  fetchIssues,
} from "../services/githubServices.js";

import {
  fetchPRReviews,
} from "../services/githubServices.js";

import {
  calculateDeveloperMetrics,
} from "../metrics/developerMetrics.js";


export async function getDeveloperMetrics({
  user,
  repo,
  githubToken,
}) {
  const [
    commits,
    pullRequests,
    issues,
  ] = await Promise.all([
    fetchCommits(
      user,
      repo,
      githubToken
    ),

    fetchPullRequests(
      user,
      repo,
      githubToken
    ),

    fetchIssues(
      user,
      repo,
      githubToken
    ),
  ]);

  const reviewData =
    await Promise.all(
      pullRequests.map(async (pullRequest) => {
        const reviews =
          await fetchPRReviews(
            user,
            repo,
            githubToken,
            pullRequest.number
          );

        return {
          pullRequestNumber:
            pullRequest.number,

          reviews,
        };
      })
    );

  return calculateDeveloperMetrics({
    commits,
    pullRequests,
    reviewData,
    issues,
  });
}
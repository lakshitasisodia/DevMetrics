
import {
  fetchPullRequests,
  fetchPRReviews,
} from "../services/githubServices.js";

import {
  calculateReviewMetrics,
} from "../metrics/reviewMetrics.js";


export async function getReviewMetrics({
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

          createdAt:
            pullRequest.created_at,

          reviews,
        };
      })
    );

  return calculateReviewMetrics(
    reviewData,
    pullRequests.length
  );
}
// ======================================================
// DevMetrics - Metrics Orchestrator
// ======================================================
import {
  fetchGithubRepo,
  fetchCommits,
  fetchPullRequests,
  fetchIssues,
  fetchContributors,
  fetchLanguages,
  fetchCommitDetails,
  fetchAllPRReviews,
} from "../services/githubServices.js";

import {
  validateNonNegative,
  validatePercentage,
} from "../metrics/metricUtils.js";

import {
  calculateCommitMetrics,
} from "../metrics/commitMetrics.js";

import {
  calculatePullRequestMetrics,
} from "../metrics/pullRequestMetrics.js";

import {
  calculateReviewMetrics,
} from "../metrics/reviewMetrics.js";

import {
  calculateIssueMetrics,
} from "../metrics/issueMetrics.js";

import {
  calculateRepositoryMetrics,
} from "../metrics/repositoryMetrics.js";

import {
  calculateDeveloperMetrics,
} from "../metrics/developerMetrics.js";






async function fetchRawMetricsData({
  user,
  repo,
  githubToken,
}) {
  const [
    repository,
    commits,
    pullRequests,
    issues,
    contributors,
    languages,
  ] = await Promise.all([
    fetchGithubRepo(
      user,
      repo,
      githubToken
    ),

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

    fetchContributors(
      user,
      repo,
      githubToken
    ),

    fetchLanguages(
      user,
      repo,
      githubToken
    ),
  ]);

  const detailedCommits = await fetchCommitDetails(
  user,
  repo,
  githubToken,
  commits,
);

  const reviewData = await fetchAllPRReviews(
  user,
  repo,
  githubToken,
  pullRequests,
);

  return {
    repository,
    commits: detailedCommits,
    pullRequests,
    issues,
    contributors,
    languages,
    reviewData,
  };
}

// ------------------------------------------------------
// CALCULATE COMPLETE METRICS
// ------------------------------------------------------

export async function getCompleteMetrics({
  user,
  repo,
  githubToken,
  period = null,
  referenceDate = new Date(),
}) {
  const rawData =
    await fetchRawMetricsData({
      user,
      repo,
      githubToken,
    });

  const {
    repository,
    commits,
    pullRequests,
    issues,
    contributors,
    languages,
    reviewData,
  } = rawData;

  const commitMetrics =
    calculateCommitMetrics(
      commits,
      period
    );

  const pullRequestMetrics =
    calculatePullRequestMetrics(
      pullRequests
    );

  const reviewMetrics =
    calculateReviewMetrics(
      reviewData,
      pullRequests.length
    );

  const issueMetrics =
    calculateIssueMetrics(
      issues
    );

  const repositoryMetrics =
    calculateRepositoryMetrics(
      repository,
      contributors,
      languages,
      referenceDate
    );

  const developerMetrics =
    calculateDeveloperMetrics({
      commits,
      pullRequests,
      reviewData,
      issues,
    });

  const metrics = {
  repository: repositoryMetrics,
  commits: commitMetrics,
  pullRequests: pullRequestMetrics,
  reviews: reviewMetrics,
  issues: issueMetrics,
  developers: developerMetrics,
  generatedAt: new Date().toISOString(),
};

return validateMetrics(metrics);
}


function validateMetrics(metrics) {
  const nonNegativeFields = [
    ["repository.stars", metrics.repository.stars],
    ["repository.forks", metrics.repository.forks],
    ["repository.contributors", metrics.repository.contributors],
    ["repository.repositoryAge", metrics.repository.repositoryAge],

    ["commits.totalCommits", metrics.commits.totalCommits],
    ["commits.activeContributors", metrics.commits.activeContributors],
    ["commits.totalAdditions", metrics.commits.totalAdditions],
    ["commits.totalDeletions", metrics.commits.totalDeletions],
    ["commits.codeChurn", metrics.commits.codeChurn],
    [
      "commits.averageCommitsPerContributor",
      metrics.commits.averageCommitsPerContributor,
    ],
    ["commits.commitFrequency", metrics.commits.commitFrequency],

    ["pullRequests.totalPRs", metrics.pullRequests.totalPRs],
    ["pullRequests.openPRs", metrics.pullRequests.openPRs],
    ["pullRequests.mergedPRs", metrics.pullRequests.mergedPRs],
    [
      "pullRequests.closedWithoutMerge",
      metrics.pullRequests.closedWithoutMerge,
    ],
    [
      "pullRequests.averagePRSize",
      metrics.pullRequests.averagePRSize,
    ],
    [
      "pullRequests.averagePRCycleTime",
      metrics.pullRequests.averagePRCycleTime,
    ],
    [
      "pullRequests.medianPRCycleTime",
      metrics.pullRequests.medianPRCycleTime,
    ],
    [
      "pullRequests.longestPRCycleTime",
      metrics.pullRequests.longestPRCycleTime,
    ],

    ["reviews.totalReviews", metrics.reviews.totalReviews],
    ["reviews.reviewsPerPR", metrics.reviews.reviewsPerPR],
    [
      "reviews.averageTimeToFirstReview",
      metrics.reviews.averageTimeToFirstReview,
    ],

    ["issues.totalIssues", metrics.issues.totalIssues],
    ["issues.openIssues", metrics.issues.openIssues],
    ["issues.closedIssues", metrics.issues.closedIssues],
    [
      "issues.averageResolutionTime",
      metrics.issues.averageResolutionTime,
    ],
    [
      "issues.medianResolutionTime",
      metrics.issues.medianResolutionTime,
    ],
  ];

  for (const [field, value] of nonNegativeFields) {
  validateNonNegative(value, field);
}

  const percentageFields = [
    ["pullRequests.mergeRate", metrics.pullRequests.mergeRate],
    ["issues.closureRate", metrics.issues.closureRate],
  ];

 for (const [field, value] of percentageFields) {
  if (value !== null) {
    validatePercentage(value, field);
  }
}

  return metrics;
}
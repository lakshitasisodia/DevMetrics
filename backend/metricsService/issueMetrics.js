
import {
  fetchIssues,
} from "../services/githubServices.js";

import {
  calculateIssueMetrics,
} from "../metrics/issueMetrics.js";

export async function getIssueMetrics({
  user,
  repo,
  githubToken,
}) {
  const issues =
    await fetchIssues(
      user,
      repo,
      githubToken
    );

  return calculateIssueMetrics(
    issues
  );
}
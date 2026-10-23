// ======================================================
// DevMetrics - Commit Metrics Service
// ======================================================

import { fetchCommits } from "../services/githubServices.js";

import {
  calculateCommitMetrics,
} from "../metrics/commitMetrics.js";

export async function getCommitMetrics({
  user,
  repo,
  githubToken,
  period = null,
}) {
  const commits = await fetchCommits(
    user,
    repo,
    githubToken
  );

  return calculateCommitMetrics(
    commits,
    period
  );
}
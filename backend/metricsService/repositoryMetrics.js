
import {
  fetchGithubRepo,
  fetchContributors,
  fetchLanguages,
} from "../services/githubServices.js";

import {
  calculateRepositoryMetrics,
} from "../metrics/repositoryMetrics.js";

export async function getRepositoryMetrics({
  user,
  repo,
  githubToken,
  referenceDate = new Date(),
}) {
  const [
    repository,
    contributors,
    languages,
  ] = await Promise.all([
    fetchGithubRepo(
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

  return calculateRepositoryMetrics(
    repository,
    contributors,
    languages,
    referenceDate
  );
}
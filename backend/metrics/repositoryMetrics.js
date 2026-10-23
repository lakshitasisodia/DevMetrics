
import {
  ensureArray,
  roundNumber,
  safeDivide,
  safeNumber,
} from "./metricUtils.js";

export function calculateStars(repository) {
  return safeNumber(repository?.stargazers_count);
}


export function calculateForks(repository) {
  return safeNumber(repository?.forks_count);
}


export function calculateContributors(contributors) {
  return ensureArray(contributors).length;
}

export function calculatePrimaryLanguage(repository) {
  if (
    typeof repository?.language !== "string" ||
    repository.language.trim() === ""
  ) {
    return null;
  }

  return repository.language;
}

export function calculateLanguageDistribution(languages) {
  if (
    !languages ||
    typeof languages !== "object" ||
    Array.isArray(languages)
  ) {
    return {};
  }

  const entries = Object.entries(languages);

  if (entries.length === 0) {
    return {};
  }

  const totalBytes = entries.reduce(
    (sum, [, bytes]) => sum + safeNumber(bytes),
    0
  );

  if (totalBytes === 0) {
    return {};
  }

  const distribution = {};

  for (const [language, bytes] of entries) {
    const percentage =
      safeDivide(
        safeNumber(bytes),
        totalBytes
      ) * 100;

    distribution[language] =
      roundNumber(percentage);
  }

  return distribution;
}


export function calculateRepositoryAge(
  repository,
  referenceDate = new Date()
) {
  if (!repository?.created_at) {
    return 0;
  }

  const created = new Date(repository.created_at);
  const reference = new Date(referenceDate);

  if (
    Number.isNaN(created.getTime()) ||
    Number.isNaN(reference.getTime())
  ) {
    return 0;
  }

  const milliseconds =
    reference.getTime() - created.getTime();

  if (milliseconds < 0) {
    return 0;
  }

  return roundNumber(
    milliseconds / (1000 * 60 * 60 * 24)
  );
}


export function calculateRepositoryMetrics(
  repository,
  contributors,
  languages,
  referenceDate = new Date()
) {
  return {
    stars: calculateStars(repository),

    forks: calculateForks(repository),

    contributors:
      calculateContributors(contributors),

    primaryLanguage:
      calculatePrimaryLanguage(repository),

    languageDistribution:
      calculateLanguageDistribution(languages),

    repositoryAge:
      calculateRepositoryAge(
        repository,
        referenceDate
      ),
  };
}
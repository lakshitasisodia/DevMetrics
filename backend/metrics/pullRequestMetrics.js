
import {
  ensureArray,
  roundNumber,
  safeDivide,
  safeNumber,
} from "./metricUtils.js";

export function calculateTotalPRs(pullRequests) {
  return ensureArray(pullRequests).length;
}

export function calculateOpenPRs(pullRequests) {
  const prs = ensureArray(pullRequests);

  return prs.filter((pr) => pr?.state === "open").length;
}

export function calculateMergedPRs(pullRequests) {
  const prs = ensureArray(pullRequests);

  return prs.filter(
    (pr) => pr?.merged_at !== null && pr?.merged_at !== undefined
  ).length;
}

export function calculateClosedWithoutMerge(pullRequests) {
  const prs = ensureArray(pullRequests);

  return prs.filter(
    (pr) =>
      pr?.state === "closed" &&
      (pr?.merged_at === null || pr?.merged_at === undefined)
  ).length;
}

export function calculateMergeRate(pullRequests) {
  const totalPRs = calculateTotalPRs(pullRequests);
  const mergedPRs = calculateMergedPRs(pullRequests);

  return roundNumber(
    safeDivide(mergedPRs, totalPRs) * 100
  );
}

export function calculatePRSize(pullRequest) {
  if (!pullRequest || typeof pullRequest !== "object") {
    return 0;
  }

  const additions = safeNumber(pullRequest.additions);
  const deletions = safeNumber(pullRequest.deletions);

  return additions + deletions;
}

export function calculateAveragePRSize(pullRequests) {
  const prs = ensureArray(pullRequests);

  if (prs.length === 0) {
    return 0;
  }

  const totalSize = prs.reduce(
    (sum, pr) => sum + calculatePRSize(pr),
    0
  );

  return roundNumber(
    safeDivide(totalSize, prs.length)
  );
}

export function calculatePRCycleTime(pullRequest) {
  if (!pullRequest || typeof pullRequest !== "object") {
    return null;
  }

  if (!pullRequest.created_at || !pullRequest.merged_at) {
    return null;
  }

  const created = new Date(pullRequest.created_at);
  const merged = new Date(pullRequest.merged_at);

  if (
    Number.isNaN(created.getTime()) ||
    Number.isNaN(merged.getTime())
  ) {
    return null;
  }

  const milliseconds =
    merged.getTime() - created.getTime();

  if (milliseconds < 0) {
    return null;
  }

  return milliseconds / (1000 * 60 * 60);
}

export function getPRCycleTimes(pullRequests) {
  const prs = ensureArray(pullRequests);

  return prs
    .map(calculatePRCycleTime)
    .filter((hours) => hours !== null && Number.isFinite(hours));
}

export function calculateAveragePRCycleTime(pullRequests) {
  const cycleTimes = getPRCycleTimes(pullRequests);

  if (cycleTimes.length === 0) {
    return 0;
  }

  const totalHours = cycleTimes.reduce(
    (sum, hours) => sum + hours,
    0
  );

  return roundNumber(
    safeDivide(totalHours, cycleTimes.length)
  );
}

export function calculateMedianPRCycleTime(pullRequests) {
  const cycleTimes = getPRCycleTimes(pullRequests)
    .sort((a, b) => a - b);

  if (cycleTimes.length === 0) {
    return 0;
  }

  const middle = Math.floor(cycleTimes.length / 2);

  if (cycleTimes.length % 2 === 0) {
    return roundNumber(
      (cycleTimes[middle - 1] + cycleTimes[middle]) / 2
    );
  }

  return roundNumber(cycleTimes[middle]);
}

export function calculateLongestPRCycleTime(pullRequests) {
  const cycleTimes = getPRCycleTimes(pullRequests);

  if (cycleTimes.length === 0) {
    return 0;
  }

  return roundNumber(Math.max(...cycleTimes));
}

export function calculatePullRequestMetrics(pullRequests) {
  const prs = ensureArray(pullRequests);

  const totalPRs = calculateTotalPRs(prs);
  const openPRs = calculateOpenPRs(prs);
  const mergedPRs = calculateMergedPRs(prs);
  const closedWithoutMerge =
    calculateClosedWithoutMerge(prs);

  return {
    totalPRs,
    openPRs,
    mergedPRs,
    closedWithoutMerge,
    mergeRate: calculateMergeRate(prs),
    averagePRSize: calculateAveragePRSize(prs),
    averagePRCycleTime:
      calculateAveragePRCycleTime(prs),
    medianPRCycleTime:
      calculateMedianPRCycleTime(prs),
    longestPRCycleTime:
      calculateLongestPRCycleTime(prs),
  };
}
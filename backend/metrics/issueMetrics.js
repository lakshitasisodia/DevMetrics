
import {
  ensureArray,
  roundNumber,
  safeDivide,
} from "./metricUtils.js";



export function isActualIssue(issue) {
  if (!issue || typeof issue !== "object") {
    return false;
  }

  return !issue.pull_request;
}



export function getActualIssues(issues) {
  return ensureArray(issues).filter(isActualIssue);
}

export function calculateTotalIssues(issues) {
  return getActualIssues(issues).length;
}

export function calculateOpenIssues(issues) {
  return getActualIssues(issues).filter(
    (issue) => issue.state === "open"
  ).length;
}

export function calculateClosedIssues(issues) {
  return getActualIssues(issues).filter(
    (issue) => issue.state === "closed"
  ).length;
}


export function calculateClosureRate(issues) {
  const totalIssues = calculateTotalIssues(issues);
  const closedIssues = calculateClosedIssues(issues);

  return roundNumber(
    safeDivide(closedIssues, totalIssues) * 100
  );
}

// Result is returned in HOURS.
// ------------------------------------------------------

export function calculateIssueResolutionTime(issue) {
  if (!isActualIssue(issue)) {
    return null;
  }

  if (!issue.created_at || !issue.closed_at) {
    return null;
  }

  const created = new Date(issue.created_at);
  const closed = new Date(issue.closed_at);

  if (
    Number.isNaN(created.getTime()) ||
    Number.isNaN(closed.getTime())
  ) {
    return null;
  }

  const milliseconds =
    closed.getTime() - created.getTime();

  if (milliseconds < 0) {
    return null;
  }

  return milliseconds / (1000 * 60 * 60);
}


export function getIssueResolutionTimes(issues) {
  return getActualIssues(issues)
    .map(calculateIssueResolutionTime)
    .filter(
      (hours) =>
        hours !== null &&
        Number.isFinite(hours)
    );
}


export function calculateAverageResolutionTime(issues) {
  const resolutionTimes =
    getIssueResolutionTimes(issues);

  if (resolutionTimes.length === 0) {
    return 0;
  }

  const totalHours = resolutionTimes.reduce(
    (sum, hours) => sum + hours,
    0
  );

  return roundNumber(
    safeDivide(
      totalHours,
      resolutionTimes.length
    )
  );
}


export function calculateMedianResolutionTime(issues) {
  const resolutionTimes =
    getIssueResolutionTimes(issues)
      .sort((a, b) => a - b);

  if (resolutionTimes.length === 0) {
    return 0;
  }

  const middle =
    Math.floor(resolutionTimes.length / 2);

  if (resolutionTimes.length % 2 === 0) {
    return roundNumber(
      (
        resolutionTimes[middle - 1] +
        resolutionTimes[middle]
      ) / 2
    );
  }

  return roundNumber(resolutionTimes[middle]);
}


export function calculateIssueMetrics(issues) {
  const issueList = ensureArray(issues);

  return {
    totalIssues:
      calculateTotalIssues(issueList),

    openIssues:
      calculateOpenIssues(issueList),

    closedIssues:
      calculateClosedIssues(issueList),

    closureRate:
      calculateClosureRate(issueList),

    averageResolutionTime:
      calculateAverageResolutionTime(issueList),

    medianResolutionTime:
      calculateMedianResolutionTime(issueList),
  };
}
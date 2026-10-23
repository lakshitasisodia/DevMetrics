import {
  ensureArray,
  getCommitAuthorIdentity,
  getCommitDate,
  roundNumber,
  safeDivide,
  safeNumber,
} from "./metricUtils.js";


export function calculateTotalCommits(commits){
    const commitList = ensureArray(commits);

    return commitList.length;
}


export function calculateActiveContributors(commits){
    const commitList = ensureArray(commits);

    const contributors = new Set();

    for(const commit of commitList){
        const identity = getCommitAuthorIdentity(commit);

        if(identity) contributors.add(identity);

    }
    
    return contributors.size;
   
}

export function calculateTotalAdditions(commits) {
  const commitList = ensureArray(commits);

  let totalAdditions = 0;

  for (const commit of commitList) {
    const additions =
      commit &&
      commit.stats &&
      commit.stats.additions;

    totalAdditions += safeNumber(additions);
  }

  return totalAdditions;
}

export function calculateTotalDeletions(commits) {
  const commitList = ensureArray(commits);

  let totalDeletions = 0;

  for (const commit of commitList) {
    const deletions =
      commit &&
      commit.stats &&
      commit.stats.deletions;

    totalDeletions += safeNumber(deletions);
  }

  return totalDeletions;
}

export function calculateCodeChurn(commits) {
  const additions = calculateTotalAdditions(commits);
  const deletions = calculateTotalDeletions(commits);

  return additions + deletions;
}


export function calculateAverageCommitsPerContributor(commits) {
  const totalCommits = calculateTotalCommits(commits);
  const activeContributors = calculateActiveContributors(commits);

  return roundNumber(
    safeDivide(totalCommits, activeContributors)
  );
}
export function calculateCommitFrequency(
  commits,
  startDate,
  endDate
) {
  const commitList = ensureArray(commits);

  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 0;
  }

  const differenceMilliseconds =
    end.getTime() - start.getTime();

  const differenceDays =
    differenceMilliseconds / (1000 * 60 * 60 * 24);

  if (differenceDays <= 0) {
    return 0;
  }

  return roundNumber(
    safeDivide(commitList.length, differenceDays)
  );
}

export function calculateCommitMetrics(
  commits,
  period = null
) {
  const commitList = ensureArray(commits);

  const totalCommits =
    calculateTotalCommits(commitList);

  const activeContributors =
    calculateActiveContributors(commitList);

  const totalAdditions =
    calculateTotalAdditions(commitList);

  const totalDeletions =
    calculateTotalDeletions(commitList);

  const codeChurn =
    totalAdditions + totalDeletions;

  const averageCommitsPerContributor =
    roundNumber(
      safeDivide(
        totalCommits,
        activeContributors
      )
    );

  let commitFrequency = 0;

  if (
    period &&
    period.startDate &&
    period.endDate
  ) {
    commitFrequency =
      calculateCommitFrequency(
        commitList,
        period.startDate,
        period.endDate
      );
  }

  return {
    totalCommits,
    activeContributors,
    totalAdditions,
    totalDeletions,
    codeChurn,
    averageCommitsPerContributor,
    commitFrequency,
  };
}




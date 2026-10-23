// ======================================================
// DevMetrics - Part 3 Metrics Test
// ======================================================

import {
  calculateIssueMetrics,
} from "./issueMetrics.js";

import {
  calculateRepositoryMetrics,
} from "./repositoryMetrics.js";

// ======================================================
// TEST ISSUE DATA
// ======================================================
//
// Notice that issue #3 contains `pull_request`.
//
// It MUST NOT be counted as an issue.
// ======================================================

const issues = [
  {
    number: 1,
    state: "closed",

    created_at: "2026-09-01T10:00:00Z",
    closed_at: "2026-09-01T18:00:00Z",
  },

  {
    number: 2,
    state: "closed",

    created_at: "2026-09-02T10:00:00Z",
    closed_at: "2026-09-04T10:00:00Z",
  },

  {
    number: 3,
    state: "closed",

    created_at: "2026-09-03T10:00:00Z",
    closed_at: "2026-09-03T12:00:00Z",

    // This represents a PR returned by the
    // GitHub Issues API.
    pull_request: {
      url: "https://api.github.com/repos/example/example/pulls/3",
    },
  },

  {
    number: 4,
    state: "open",

    created_at: "2026-09-05T10:00:00Z",
    closed_at: null,
  },

  {
    number: 5,
    state: "closed",

    created_at: "2026-09-06T10:00:00Z",
    closed_at: "2026-09-07T10:00:00Z",
  },
];

// ======================================================
// TEST REPOSITORY
// ======================================================

const repository = {
  stargazers_count: 120,
  forks_count: 30,
  language: "JavaScript",

  created_at: "2026-09-01T00:00:00Z",
};

const contributors = [
  { login: "alice" },
  { login: "bob" },
  { login: "charlie" },
];

const languages = {
  JavaScript: 7000,
  HTML: 2000,
  CSS: 1000,
};

// Fixed reference date makes repository age
// deterministic.
const referenceDate =
  "2026-09-11T00:00:00Z";

// ======================================================
// CALCULATE
// ======================================================

const issueMetrics =
  calculateIssueMetrics(issues);

const repositoryMetrics =
  calculateRepositoryMetrics(
    repository,
    contributors,
    languages,
    referenceDate
  );

// ======================================================
// OUTPUT
// ======================================================

console.log("\nIssue Metrics:");
console.log(issueMetrics);

console.log("\nRepository Metrics:");
console.log(repositoryMetrics);

// ======================================================
// ASSERTIONS
// ======================================================

// -----------------------------
// Issue assertions
// -----------------------------

console.assert(
  issueMetrics.totalIssues === 4,
  "totalIssues should be 4"
);

console.assert(
  issueMetrics.openIssues === 1,
  "openIssues should be 1"
);

console.assert(
  issueMetrics.closedIssues === 3,
  "closedIssues should be 3"
);

console.assert(
  issueMetrics.closureRate === 75,
  "closureRate should be 75%"
);

console.assert(
  issueMetrics.averageResolutionTime === 32,
  "averageResolutionTime should be 32 hours"
);

console.assert(
  issueMetrics.medianResolutionTime === 24,
  "medianResolutionTime should be 24 hours"
);

// -----------------------------
// Repository assertions
// -----------------------------

console.assert(
  repositoryMetrics.stars === 120,
  "stars should be 120"
);

console.assert(
  repositoryMetrics.forks === 30,
  "forks should be 30"
);

console.assert(
  repositoryMetrics.contributors === 3,
  "contributors should be 3"
);

console.assert(
  repositoryMetrics.primaryLanguage === "JavaScript",
  "primaryLanguage should be JavaScript"
);

console.assert(
  repositoryMetrics.languageDistribution.JavaScript === 70,
  "JavaScript should be 70%"
);

console.assert(
  repositoryMetrics.languageDistribution.HTML === 20,
  "HTML should be 20%"
);

console.assert(
  repositoryMetrics.languageDistribution.CSS === 10,
  "CSS should be 10%"
);

console.assert(
  repositoryMetrics.repositoryAge === 10,
  "repositoryAge should be 10 days"
);

console.log("\nAll Part 3 assertions passed.");

// ======================================================
// EDGE CASE TESTS
// ======================================================

console.log("\nEdge Case Tests:");

// Empty issues
const emptyIssueMetrics =
  calculateIssueMetrics([]);

console.assert(
  emptyIssueMetrics.totalIssues === 0,
  "Empty issues should return 0 total"
);

console.assert(
  emptyIssueMetrics.closureRate === 0,
  "Empty issues should return 0 closure rate"
);

console.assert(
  emptyIssueMetrics.averageResolutionTime === 0,
  "Empty issues should return 0 average resolution time"
);

// Empty repository data
const emptyRepositoryMetrics =
  calculateRepositoryMetrics(
    {},
    [],
    {},
    referenceDate
  );

console.assert(
  emptyRepositoryMetrics.stars === 0,
  "Missing stars should return 0"
);

console.assert(
  emptyRepositoryMetrics.forks === 0,
  "Missing forks should return 0"
);

console.assert(
  emptyRepositoryMetrics.contributors === 0,
  "Missing contributors should return 0"
);

console.assert(
  emptyRepositoryMetrics.primaryLanguage === null,
  "Missing language should return null"
);

console.assert(
  Object.keys(
    emptyRepositoryMetrics.languageDistribution
  ).length === 0,
  "Missing languages should return empty object"
);

// Invalid issue dates
const invalidIssue = [
  {
    state: "closed",
    created_at: "not-a-date",
    closed_at: "also-not-a-date",
  },
];

const invalidIssueMetrics =
  calculateIssueMetrics(invalidIssue);

console.assert(
  invalidIssueMetrics.averageResolutionTime === 0,
  "Invalid dates should return 0 average resolution time"
);

console.log("All Part 3 edge-case assertions passed.");
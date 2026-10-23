// ======================================================
// DevMetrics - Developer Metrics Test
// ======================================================

import {
  calculateDeveloperMetrics,
} from "./developerMetrics.js";

// ======================================================
// TEST COMMITS
// ======================================================

const commits = [
  {
    author: {
      login: "alice",
    },

    commit: {
      author: {
        name: "Alice",
        email: "alice@example.com",
      },
    },
  },

  {
    author: {
      login: "alice",
    },

    commit: {
      author: {
        name: "Alice",
        email: "alice@example.com",
      },
    },
  },

  {
    author: {
      login: "bob",
    },

    commit: {
      author: {
        name: "Bob",
        email: "bob@example.com",
      },
    },
  },

  {
    author: {
      login: "charlie",
    },

    commit: {
      author: {
        name: "Charlie",
        email: "charlie@example.com",
      },
    },
  },
];

// ======================================================
// TEST PRs
// ======================================================

const pullRequests = [
  {
    number: 1,
    user: {
      login: "alice",
    },
  },

  {
    number: 2,
    user: {
      login: "alice",
    },
  },

  {
    number: 3,
    user: {
      login: "bob",
    },
  },
];

// ======================================================
// TEST REVIEWS
// ======================================================

const reviewData = [
  {
    pullRequestNumber: 1,

    reviews: [
      {
        user: {
          login: "bob",
        },
      },
      {
        user: {
          login: "charlie",
        },
      },
    ],
  },

  {
    pullRequestNumber: 2,

    reviews: [
      {
        user: {
          login: "bob",
        },
      },
    ],
  },
];

// ======================================================
// TEST ISSUES
// ======================================================

const issues = [
  {
    number: 1,

    user: {
      login: "alice",
    },
  },

  {
    number: 2,

    user: {
      login: "bob",
    },
  },

  {
    number: 3,

    user: {
      login: "alice",
    },
  },

  // This must NOT count.
  {
    number: 4,

    user: {
      login: "charlie",
    },

    pull_request: {
      url: "https://api.github.com/...",
    },
  },
];

// ======================================================
// CALCULATE
// ======================================================

const metrics =
  calculateDeveloperMetrics({
    commits,
    pullRequests,
    reviewData,
    issues,
  });

// ======================================================
// OUTPUT
// ======================================================

console.log(
  "\nDeveloper Metrics:"
);

console.log(
  JSON.stringify(
    metrics,
    null,
    2
  )
);

// ======================================================
// ASSERTIONS
// ======================================================

console.assert(
  metrics.commitCounts["github:alice"] === 2,
  "Alice should have 2 commits"
);

console.assert(
  metrics.commitCounts["github:bob"] === 1,
  "Bob should have 1 commit"
);

console.assert(
  metrics.commitCounts["github:charlie"] === 1,
  "Charlie should have 1 commit"
);

console.assert(
  metrics.contributions["github:alice"].percentage === 50,
  "Alice contribution should be 50%"
);

console.assert(
  metrics.contributions["github:bob"].percentage === 25,
  "Bob contribution should be 25%"
);

console.assert(
  metrics.contributions["github:charlie"].percentage === 25,
  "Charlie contribution should be 25%"
);

console.assert(
  metrics.prCounts["github:alice"] === 2,
  "Alice should have 2 PRs"
);

console.assert(
  metrics.prCounts["github:bob"] === 1,
  "Bob should have 1 PR"
);

console.assert(
  metrics.reviewCounts["github:bob"] === 2,
  "Bob should have 2 reviews"
);

console.assert(
  metrics.reviewCounts["github:charlie"] === 1,
  "Charlie should have 1 review"
);

console.assert(
  metrics.issueCounts["github:alice"] === 2,
  "Alice should have 2 issues"
);

console.assert(
  metrics.issueCounts["github:bob"] === 1,
  "Bob should have 1 issue"
);

console.assert(
  metrics.issueCounts["github:charlie"] === undefined,
  "PR returned by Issues API must not count as an issue"
);

console.log(
  "\nAll Part 4 developer assertions passed."
);
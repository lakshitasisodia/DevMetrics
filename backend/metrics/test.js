import {
  calculateCommitMetrics,
} from "./commitMetrics.js";

const testCommits = [
  {
    sha: "abc123",

    author: {
      login: "alice",
    },

    commit: {
      author: {
        name: "Alice",
        email: "alice@example.com",
        date: "2026-09-01T10:00:00Z",
      },
    },

    stats: {
      additions: 100,
      deletions: 20,
    },
  },

  {
    sha: "def456",

    author: {
      login: "bob",
    },

    commit: {
      author: {
        name: "Bob",
        email: "bob@example.com",
        date: "2026-09-02T10:00:00Z",
      },
    },

    stats: {
      additions: 50,
      deletions: 10,
    },
  },

  {
    sha: "ghi789",

    author: {
      login: "alice",
    },

    commit: {
      author: {
        name: "Alice",
        email: "alice@example.com",
        date: "2026-09-03T10:00:00Z",
      },
    },

    stats: {
      additions: 30,
      deletions: 5,
    },
  },

  {
    sha: "jkl012",

    author: null,

    commit: {
      author: {
        name: "Charlie",
        email: "charlie@example.com",
        date: "2026-09-04T10:00:00Z",
      },
    },

    stats: {
      additions: 20,
      deletions: 5,
    },
  },
];

console.log(
  calculateCommitMetrics([])
);

console.log(
  calculateCommitMetrics(null)
);

console.log(
  calculateCommitMetrics([
    {
      author: null,
      commit: {
        author: {
          name: null,
          email: null,
        },
      },
    },
  ])
);

console.log(
  calculateCommitMetrics([
    {
      author: {
        login: "alice",
      },
    },
  ])
);
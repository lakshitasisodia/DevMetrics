import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { db } from "../../database/src/prisma/db.ts";
import { encrypt, decrypt } from "../utils/encryption.js";

import {
  fetchGithubRepo,
  fetchForks,
  fetchContributors,
  fetchCommits,
  fetchIndividualCommit,
  fetchPullRequests,
  fetchIndividualPR,
  fetchPRReviews,
  fetchPRComments,
  fetchIssues,
  fetchIndividualIssue,
  fetchIssueTimeline,
  fetchCollaborators,
  fetchLanguages,
  fetchBranches,
  fetchUserRepositories,
} from "../services/githubServices.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Helper: Get Connected GitHub Account
|--------------------------------------------------------------------------
| Used when the user needs their stored GitHub token.
*/
const getUserGithubAccount = async (userId) => {
  return await db.orm.public.GithubAccount.where({ userId }).first();
};

/*
|--------------------------------------------------------------------------
| Helper: Get User's GitHub Token
|--------------------------------------------------------------------------
| Used for routes where repository selection is not required.
*/
const getUserGithubToken = async (userId) => {
  const githubAccount = await getUserGithubAccount(userId);

  if (!githubAccount) {
    return null;
  }

  return decrypt(githubAccount.encryptedToken);
};

/*
|--------------------------------------------------------------------------
| Helper: Get User GitHub Context
|--------------------------------------------------------------------------
| Verifies:
| 1. The authenticated user has a connected GitHub account.
| 2. The requested repository belongs to that GitHub account.
| 3. The repository has been selected in DevMetrics.
|
| Returns:
| - githubToken
| - githubAccount
| - selected repository
|
| Returns null when the repository is not authorized.
*/
const getUserGithubContext = async (userId, user, repo) => {
  const githubAccount = await db.orm.public.GithubAccount.where({
    userId,
  }).first();

  if (!githubAccount) {
    return null;
  }

  const fullName = `${user}/${repo}`;

  const selectedRepository = await db.orm.public.Repository.where({
    githubAccountId: githubAccount.id,
    fullName,
  }).first();

  if (!selectedRepository) {
    return null;
  }

  const githubToken = decrypt(githubAccount.encryptedToken);

  return {
    githubToken,
    githubAccount,
    repository: selectedRepository,
  };
};

/*
|--------------------------------------------------------------------------
| CONNECT GITHUB ACCOUNT
|--------------------------------------------------------------------------
| POST /api/github/connect
|
| Requires:
| - JWT authentication
| - githubUsername
| - githubToken
|
| Verifies the token against GitHub before storing it.
*/
router.post("/connect", authMiddleware, async (req, res) => {
  try {
    const { githubUsername, githubToken } = req.body;

    if (!githubUsername || !githubToken) {
      return res.status(400).json({
        error: "githubUsername and githubToken are required",
      });
    }

    // Verify GitHub token
    const githubResponse = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "DevMetrics",
        Authorization: `Bearer ${githubToken}`,
      },
    });

    if (!githubResponse.ok) {
      return res.status(401).json({
        error: "Invalid GitHub token",
      });
    }

    const githubUser = await githubResponse.json();

    // Make sure supplied username matches token owner
    if (githubUser.login.toLowerCase() !== githubUsername.toLowerCase()) {
      return res.status(400).json({
        error: "GitHub username does not match the token owner",
      });
    }
    // Check if account already connected
    const existingAccount = await db.orm.public.GithubAccount.where({
      userId: req.user.userId,
    }).first();

    // Encrypt the newly validated token
    const encryptedToken = encrypt(githubToken);

    if (existingAccount) {
      // Update the stored token when reconnecting
      const updatedAccount = await db.orm.public.GithubAccount.where({
        id: existingAccount.id,
      }).update({
        githubUsername: githubUser.login,
        encryptedToken,
      });

      return res.status(200).json({
        message: "GitHub account updated successfully",
        githubAccount: {
          id: existingAccount.id,
          githubUsername: updatedAccount.githubUsername,
        },
      });
    }

    // Create a new account on first connection
    const githubAccount = await db.orm.public.GithubAccount.create({
      githubUsername: githubUser.login,
      encryptedToken,
      userId: req.user.userId,
    });

    return res.status(201).json({
      message: "GitHub account connected successfully",
      githubAccount: {
        id: githubAccount.id,
        githubUsername: githubAccount.githubUsername,
      },
    });
  } catch (error) {
    console.error("GitHub connect error:", error);

    return res.status(500).json({
      error: "Failed to connect GitHub account",
    });
  }
});

/*
|--------------------------------------------------------------------------
| FETCH USER'S GITHUB REPOSITORIES
|--------------------------------------------------------------------------
| GET /api/github/repositories
|
| Returns repositories available on the authenticated user's GitHub account.
|
| NOTE:
| This route does NOT require a repository to already be selected.
*/
router.get("/repositories", authMiddleware, async (req, res) => {
  try {
    const githubToken = await getUserGithubToken(req.user.userId);

    if (!githubToken) {
      return res.status(404).json({
        error: "GitHub account is not connected",
      });
    }

    const repositories = await fetchUserRepositories(githubToken);

    return res.status(200).json({
      repositories,
    });
  } catch (error) {
    console.error("Fetch GitHub repositories error:", error);

    return res.status(500).json({
      error: "Failed to fetch GitHub repositories",
    });
  }
});

/*
|--------------------------------------------------------------------------
| SELECT REPOSITORY
|--------------------------------------------------------------------------
| POST /api/github/repositories/select
|
| Adds a GitHub repository to the user's selected repositories.
*/
router.post("/repositories/select", authMiddleware, async (req, res) => {
  try {
    const { githubRepoId, repoName, fullName } = req.body;

    if (githubRepoId === undefined || !repoName || !fullName) {
      return res.status(400).json({
        error: "githubRepoId, repoName and fullName are required",
      });
    }

    const githubAccount = await getUserGithubAccount(req.user.userId);

    if (!githubAccount) {
      return res.status(404).json({
        error: "GitHub account is not connected",
      });
    }

    // Prevent duplicate selection
    const existingRepository = await db.orm.public.Repository.where({
      githubAccountId: githubAccount.id,
      githubRepoId,
    }).first();

    if (existingRepository) {
      return res.status(409).json({
        error: "Repository is already selected",
      });
    }

    const repository = await db.orm.public.Repository.create({
      githubRepoId,
      repoName,
      fullName,
      githubAccountId: githubAccount.id,
    });

    return res.status(201).json({
      message: "Repository selected successfully",
      repository,
    });
  } catch (error) {
    console.error("Select repository error:", error);

    return res.status(500).json({
      error: "Failed to select repository",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET SELECTED REPOSITORIES
|--------------------------------------------------------------------------
| GET /api/github/repositories/selected
*/
router.get("/repositories/selected", authMiddleware, async (req, res) => {
  try {
    const githubAccount = await getUserGithubAccount(req.user.userId);

    if (!githubAccount) {
      return res.status(404).json({
        error: "GitHub account is not connected",
      });
    }

    const repositories = await db.orm.public.Repository.where({
      githubAccountId: githubAccount.id,
    }).all();

    return res.status(200).json({
      repositories,
    });
  } catch (error) {
    console.error("Selected repositories error:", error);

    return res.status(500).json({
      error: "Failed to fetch selected repositories",
    });
  }
});

/*
|--------------------------------------------------------------------------
| REPOSITORY DETAILS
|--------------------------------------------------------------------------
| GET /api/github/:user/:repo
*/
router.get("/:user/:repo", authMiddleware, async (req, res) => {
  try {
    const { user, repo } = req.params;

    const context = await getUserGithubContext(req.user.userId, user, repo);

    if (!context) {
      return res.status(404).json({
        error: "Repository is not selected or GitHub account is not connected",
      });
    }

    const data = await fetchGithubRepo(user, repo, context.githubToken);

    return res.status(200).json(data);
  } catch (error) {
    console.error("Fetch repository error:", error);

    return res.status(500).json({
      error: "Failed to fetch repository data",
    });
  }
});

/*
|--------------------------------------------------------------------------
| FORKS
|--------------------------------------------------------------------------
| GET /api/github/:user/:repo/forks
*/
router.get("/:user/:repo/forks", authMiddleware, async (req, res) => {
  try {
    const { user, repo } = req.params;

    const context = await getUserGithubContext(req.user.userId, user, repo);

    if (!context) {
      return res.status(404).json({
        error: "Repository is not selected or GitHub account is not connected",
      });
    }

    const data = await fetchForks(user, repo, context.githubToken);

    return res.status(200).json(data);
  } catch (error) {
    console.error("Fetch forks error:", error);

    return res.status(500).json({
      error: "Failed to fetch forks",
    });
  }
});

/*
|--------------------------------------------------------------------------
| CONTRIBUTORS
|--------------------------------------------------------------------------
| GET /api/github/:user/:repo/contributors
*/
router.get("/:user/:repo/contributors", authMiddleware, async (req, res) => {
  try {
    const { user, repo } = req.params;

    const context = await getUserGithubContext(req.user.userId, user, repo);

    if (!context) {
      return res.status(404).json({
        error: "Repository is not selected or GitHub account is not connected",
      });
    }

    const data = await fetchContributors(user, repo, context.githubToken);

    return res.status(200).json(data);
  } catch (error) {
    console.error("Fetch contributors error:", error);

    return res.status(500).json({
      error: "Failed to fetch contributors",
    });
  }
});

/*
|--------------------------------------------------------------------------
| COMMITS
|--------------------------------------------------------------------------
| GET /api/github/:user/:repo/commits
*/
router.get("/:user/:repo/commits", authMiddleware, async (req, res) => {
  try {
    const { user, repo } = req.params;

    const context = await getUserGithubContext(req.user.userId, user, repo);

    if (!context) {
      return res.status(404).json({
        error: "Repository is not selected or GitHub account is not connected",
      });
    }

    const data = await fetchCommits(user, repo, context.githubToken);

    return res.status(200).json(data);
  } catch (error) {
    console.error("Fetch commits error:", error);

    return res.status(500).json({
      error: "Failed to fetch commits",
    });
  }
});

/*
|--------------------------------------------------------------------------
| INDIVIDUAL COMMIT
|--------------------------------------------------------------------------
| GET /api/github/:user/:repo/commit/:sha
*/
router.get("/:user/:repo/commit/:sha", authMiddleware, async (req, res) => {
  try {
    const { user, repo, sha } = req.params;

    const context = await getUserGithubContext(req.user.userId, user, repo);

    if (!context) {
      return res.status(404).json({
        error: "Repository is not selected or GitHub account is not connected",
      });
    }

    const data = await fetchIndividualCommit(
      user,
      repo,
      context.githubToken,
      sha,
    );

    return res.status(200).json(data);
  } catch (error) {
    console.error("Fetch individual commit error:", error);

    return res.status(500).json({
      error: "Failed to fetch commit",
    });
  }
});

/*
|--------------------------------------------------------------------------
| PULL REQUESTS
|--------------------------------------------------------------------------
| GET /api/github/:user/:repo/pull-requests
*/
router.get("/:user/:repo/pull-requests", authMiddleware, async (req, res) => {
  try {
    const { user, repo } = req.params;

    const context = await getUserGithubContext(req.user.userId, user, repo);

    if (!context) {
      return res.status(404).json({
        error: "Repository is not selected or GitHub account is not connected",
      });
    }

    const data = await fetchPullRequests(user, repo, context.githubToken);

    return res.status(200).json(data);
  } catch (error) {
    console.error("Fetch pull requests error:", error);

    return res.status(500).json({
      error: "Failed to fetch pull requests",
    });
  }
});

/*
|--------------------------------------------------------------------------
| INDIVIDUAL PULL REQUEST
|--------------------------------------------------------------------------
| GET /api/github/:user/:repo/pull-request/:number
*/
router.get(
  "/:user/:repo/pull-request/:number",
  authMiddleware,
  async (req, res) => {
    try {
      const { user, repo, number } = req.params;

      const context = await getUserGithubContext(req.user.userId, user, repo);

      if (!context) {
        return res.status(404).json({
          error:
            "Repository is not selected or GitHub account is not connected",
        });
      }

      const data = await fetchIndividualPR(
        user,
        repo,
        context.githubToken,
        number,
      );

      return res.status(200).json(data);
    } catch (error) {
      console.error("Fetch individual PR error:", error);

      return res.status(500).json({
        error: "Failed to fetch pull request",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| PULL REQUEST REVIEWS
|--------------------------------------------------------------------------
| GET /api/github/:user/:repo/pull-request/:number/reviews
*/
router.get(
  "/:user/:repo/pull-request/:number/reviews",
  authMiddleware,
  async (req, res) => {
    try {
      const { user, repo, number } = req.params;

      const context = await getUserGithubContext(req.user.userId, user, repo);

      if (!context) {
        return res.status(404).json({
          error:
            "Repository is not selected or GitHub account is not connected",
        });
      }

      const data = await fetchPRReviews(
        user,
        repo,
        context.githubToken,
        number,
      );

      return res.status(200).json(data);
    } catch (error) {
      console.error("Fetch PR reviews error:", error);

      return res.status(500).json({
        error: "Failed to fetch pull request reviews",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| PULL REQUEST COMMENTS
|--------------------------------------------------------------------------
| GET /api/github/:user/:repo/pull-request/:number/comments
*/
router.get(
  "/:user/:repo/pull-request/:number/comments",
  authMiddleware,
  async (req, res) => {
    try {
      const { user, repo, number } = req.params;

      const context = await getUserGithubContext(req.user.userId, user, repo);

      if (!context) {
        return res.status(404).json({
          error:
            "Repository is not selected or GitHub account is not connected",
        });
      }

      const data = await fetchPRComments(
        user,
        repo,
        context.githubToken,
        number,
      );

      return res.status(200).json(data);
    } catch (error) {
      console.error("Fetch PR comments error:", error);

      return res.status(500).json({
        error: "Failed to fetch pull request comments",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| ISSUES
|--------------------------------------------------------------------------
| GET /api/github/:user/:repo/issues
*/
router.get("/:user/:repo/issues", authMiddleware, async (req, res) => {
  try {
    const { user, repo } = req.params;

    const context = await getUserGithubContext(req.user.userId, user, repo);

    if (!context) {
      return res.status(404).json({
        error: "Repository is not selected or GitHub account is not connected",
      });
    }

    const data = await fetchIssues(user, repo, context.githubToken);

    return res.status(200).json(data);
  } catch (error) {
    console.error("Fetch issues error:", error);

    return res.status(500).json({
      error: "Failed to fetch issues",
    });
  }
});

/*
|--------------------------------------------------------------------------
| INDIVIDUAL ISSUE
|--------------------------------------------------------------------------
| GET /api/github/:user/:repo/issue/:number
*/
router.get("/:user/:repo/issue/:number", authMiddleware, async (req, res) => {
  try {
    const { user, repo, number } = req.params;

    const context = await getUserGithubContext(req.user.userId, user, repo);

    if (!context) {
      return res.status(404).json({
        error: "Repository is not selected or GitHub account is not connected",
      });
    }

    const data = await fetchIndividualIssue(
      user,
      repo,
      context.githubToken,
      number,
    );

    return res.status(200).json(data);
  } catch (error) {
    console.error("Fetch individual issue error:", error);

    return res.status(500).json({
      error: "Failed to fetch issue",
    });
  }
});

/*
|--------------------------------------------------------------------------
| ISSUE TIMELINE
|--------------------------------------------------------------------------
| GET /api/github/:user/:repo/issue/:number/timeline
*/
router.get(
  "/:user/:repo/issue/:number/timeline",
  authMiddleware,
  async (req, res) => {
    try {
      const { user, repo, number } = req.params;

      const context = await getUserGithubContext(req.user.userId, user, repo);

      if (!context) {
        return res.status(404).json({
          error:
            "Repository is not selected or GitHub account is not connected",
        });
      }

      const data = await fetchIssueTimeline(
        user,
        repo,
        context.githubToken,
        number,
      );

      return res.status(200).json(data);
    } catch (error) {
      console.error("Fetch issue timeline error:", error);

      return res.status(500).json({
        error: "Failed to fetch issue timeline",
      });
    }
  },
);

/*
|--------------------------------------------------------------------------
| COLLABORATORS
|--------------------------------------------------------------------------
| GET /api/github/:user/:repo/collaborators
*/
router.get("/:user/:repo/collaborators", authMiddleware, async (req, res) => {
  try {
    const { user, repo } = req.params;

    const context = await getUserGithubContext(req.user.userId, user, repo);

    if (!context) {
      return res.status(404).json({
        error: "Repository is not selected or GitHub account is not connected",
      });
    }

    const data = await fetchCollaborators(user, repo, context.githubToken);

    return res.status(200).json(data);
  } catch (error) {
    console.error("Fetch collaborators error:", error);

    return res.status(500).json({
      error: "Failed to fetch collaborators",
    });
  }
});

/*
|--------------------------------------------------------------------------
| LANGUAGES
|--------------------------------------------------------------------------
| GET /api/github/:user/:repo/languages
*/
router.get("/:user/:repo/languages", authMiddleware, async (req, res) => {
  try {
    const { user, repo } = req.params;

    const context = await getUserGithubContext(req.user.userId, user, repo);

    if (!context) {
      return res.status(404).json({
        error: "Repository is not selected or GitHub account is not connected",
      });
    }

    const data = await fetchLanguages(user, repo, context.githubToken);

    return res.status(200).json(data);
  } catch (error) {
    console.error("Fetch languages error:", error);

    return res.status(500).json({
      error: "Failed to fetch languages",
    });
  }
});

/*
|--------------------------------------------------------------------------
| BRANCHES
|--------------------------------------------------------------------------
| GET /api/github/:user/:repo/branches
*/
router.get("/:user/:repo/branches", authMiddleware, async (req, res) => {
  try {
    const { user, repo } = req.params;

    const context = await getUserGithubContext(req.user.userId, user, repo);

    if (!context) {
      return res.status(404).json({
        error: "Repository is not selected or GitHub account is not connected",
      });
    }

    const data = await fetchBranches(user, repo, context.githubToken);

    return res.status(200).json(data);
  } catch (error) {
    console.error("Fetch branches error:", error);

    return res.status(500).json({
      error: "Failed to fetch branches",
    });
  }
});

export default router;

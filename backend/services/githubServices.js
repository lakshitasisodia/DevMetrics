// ======================================================
// DevMetrics - GitHub Services
// ======================================================

// CHANGE: Import the custom GitHub error class.
// WHY: Gives every GitHub API failure a consistent error type.
import { GithubApiError } from "../utils/githubError.js";


// ======================================================
// COMMON HELPERS
// ======================================================

const createHeaders = (githubToken) => ({
  Accept: "application/vnd.github+json",
  "User-Agent": "DevMetrics",
  Authorization: `Bearer ${githubToken}`,
});


// CHANGE: Added one shared response handler.
// WHY: All GitHub requests should handle 401, 403/rate-limit,
// 404 and 5xx errors consistently instead of creating generic Errors.
const handleGithubResponse = async (response, url) => {
  if (!response.ok) {
    let message =
      `GitHub API request failed with status ${response.status}`;

    if (response.status === 401) {
      message = "GitHub token is invalid or expired";
    } else if (response.status === 403) {
      const remaining =
        response.headers.get("x-ratelimit-remaining");

      if (remaining === "0") {
        message = "GitHub API rate limit exceeded";
      } else {
        message = "GitHub API access forbidden";
      }
    } else if (response.status === 404) {
      message = "GitHub repository or resource not found";
    } else if (response.status >= 500) {
      message = "GitHub API is temporarily unavailable";
    }

    throw new GithubApiError(
      message,
      response.status,
      {
        url,
        rateLimitRemaining:
          response.headers.get("x-ratelimit-remaining"),
        rateLimitReset:
          response.headers.get("x-ratelimit-reset"),
      }
    );
  }

  return response;
};


// ======================================================
// PAGINATION
// ======================================================

const fetchAllPages = async (baseUrl, githubToken) => {
  const allData = [];
  let page = 1;
  const perPage = 50;

  while (true) {
    const separator =
      baseUrl.includes("?") ? "&" : "?";

    const url =
      `${baseUrl}${separator}per_page=${perPage}&page=${page}`;

    const response = await fetch(url, {
      headers: createHeaders(githubToken),
    });

    // CHANGE: Use shared GitHub response handling.
    // WHY: Pagination requests now get the same rate-limit/error
    // handling as individual GitHub requests.
    await handleGithubResponse(response, url);

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new GithubApiError(
        "Expected GitHub API response to be an array",
        502
      );
    }

    allData.push(...data);

    if (data.length < perPage) {
      break;
    }

    page++;
  }

  return allData;
};


// ======================================================
// CONTROLLED CONCURRENCY
// ======================================================

const fetchInBatches = async (
  items,
  fetchFunction,
  batchSize = 10,
) => {
  const results = [];

  for (
    let i = 0;
    i < items.length;
    i += batchSize
  ) {
    const batch = items.slice(
      i,
      i + batchSize,
    );

    const batchResults = await Promise.all(
      batch.map((item) =>
        fetchFunction(item)
      ),
    );

    results.push(...batchResults);
  }

  return results;
};


// ======================================================
// 1. REPOSITORY
// GET /repos/{owner}/{repo}
// ======================================================

export async function fetchGithubRepo(
  user,
  repo,
  githubToken,
) {
  const url =
    `https://api.github.com/repos/${user}/${repo}`;

  try {
    const response = await fetch(url, {
      headers: createHeaders(githubToken),
    });

    // CHANGE: Use shared response handler.
    // WHY: Repository requests now get proper GitHub error handling.
    await handleGithubResponse(response, url);

    const data = await response.json();

    return data;

  } catch (error) {
    console.error(
      `Failed to fetch repository ${user}/${repo}:`,
      error.message,
    );

    // CHANGE: Re-throw instead of converting error to fake data.
    // WHY: The metrics layer must know that the GitHub request failed.
    throw error;
  }
}


// ======================================================
// 2. FORKS
// GET /repos/{owner}/{repo}/forks
// ======================================================

export async function fetchForks(
  user,
  repo,
  githubToken,
) {
  const url =
    `https://api.github.com/repos/${user}/${repo}/forks`;

  try {
    const response = await fetch(url, {
      headers: createHeaders(githubToken),
    });

    // CHANGE: Use shared response handler.
    // WHY: Fork requests now get consistent API/rate-limit errors.
    await handleGithubResponse(response, url);

    const data = await response.json();

    return data;

  } catch (error) {
    console.error(
      `Failed to fetch forks for ${user}/${repo}:`,
      error.message,
    );

    // CHANGE: Re-throw the real error.
    // WHY: Never return { error: ... } as if it were GitHub data.
    throw error;
  }
}


// ======================================================
// 3. CONTRIBUTORS
// GET /repos/{owner}/{repo}/contributors
// ======================================================

export async function fetchContributors(
  user,
  repo,
  githubToken,
) {
  const url =
    `https://api.github.com/repos/${user}/${repo}/contributors`;

  try {
    return await fetchAllPages(
      url,
      githubToken,
    );

  } catch (error) {
    console.error(
      `Failed to fetch contributors for ${user}/${repo}:`,
      error.message,
    );

    throw error;
  }
}


// ======================================================
// 4. COMMITS
// GET /repos/{owner}/{repo}/commits
// ======================================================

export async function fetchCommits(
  user,
  repo,
  githubToken,
) {
  const url =
    `https://api.github.com/repos/${user}/${repo}/commits`;

  try {
    return await fetchAllPages(
      url,
      githubToken,
    );

  } catch (error) {
    console.error(
      `Failed to fetch commits for ${user}/${repo}:`,
      error.message,
    );

    throw error;
  }
}


// ======================================================
// 5. INDIVIDUAL COMMIT DETAILS
// GET /repos/{owner}/{repo}/commits/{sha}
// ======================================================

export async function fetchCommitDetails(
  user,
  repo,
  githubToken,
  commits,
) {
  try {
    const detailedCommits =
      await fetchInBatches(
        commits,
        (commit) =>
          fetchIndividualCommit(
            user,
            repo,
            githubToken,
            commit.sha,
          ),
        10,
      );

    return detailedCommits;

  } catch (error) {
    console.error(
      `Failed to fetch commit details for ${user}/${repo}:`,
      error.message,
    );

    throw error;
  }
}


export async function fetchIndividualCommit(
  user,
  repo,
  githubToken,
  sha,
) {
  const url =
    `https://api.github.com/repos/${user}/${repo}/commits/${sha}`;

  try {
    const response = await fetch(url, {
      headers: createHeaders(githubToken),
    });

    // CHANGE: Use shared response handler.
    // WHY: Individual commit requests now recognize rate limits,
    // authentication failures and other GitHub errors.
    await handleGithubResponse(response, url);

    const data = await response.json();

    return data;

  } catch (error) {
    console.error(
      `Failed to fetch commit ${sha} for ${user}/${repo}:`,
      error.message,
    );

    // CHANGE: Re-throw instead of returning { error: ... }.
    // WHY: Failed commit details must not enter metric calculations.
    throw error;
  }
}


// ======================================================
// 6. PULL REQUESTS
// GET /repos/{owner}/{repo}/pulls
// ======================================================

export async function fetchPullRequests(
  user,
  repo,
  githubToken,
) {
  const url =
    `https://api.github.com/repos/${user}/${repo}/pulls?state=all`;

  try {
    return await fetchAllPages(
      url,
      githubToken,
    );

  } catch (error) {
    console.error(
      `Failed to fetch pull requests for ${user}/${repo}:`,
      error.message,
    );

    throw error;
  }
}


// ======================================================
// 7. INDIVIDUAL PR DETAILS
// GET /repos/{owner}/{repo}/pulls/{pull_number}
// ======================================================

export async function fetchIndividualPR(
  user,
  repo,
  githubToken,
  pullNumber,
) {
  const url =
    `https://api.github.com/repos/${user}/${repo}/pulls/${pullNumber}`;

  try {
    const response = await fetch(url, {
      headers: createHeaders(githubToken),
    });

    // CHANGE: Use shared response handler.
    // WHY: Individual PR requests now use the same error system.
    await handleGithubResponse(response, url);

    const data = await response.json();

    return data;

  } catch (error) {
    console.error(
      `Failed to fetch PR ${pullNumber} for ${user}/${repo}:`,
      error.message,
    );

    // CHANGE: Re-throw instead of returning fake data.
    throw error;
  }
}


// ======================================================
// 8. PR REVIEWS
// GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews
// ======================================================

export async function fetchAllPRReviews(
  user,
  repo,
  githubToken,
  pullRequests,
) {
  try {
    const results =
      await fetchInBatches(
        pullRequests,
        async (pullRequest) => {
          const reviews =
            await fetchPRReviews(
              user,
              repo,
              githubToken,
              pullRequest.number,
            );

          return {
            pullRequestNumber:
              pullRequest.number,

            createdAt:
              pullRequest.created_at,

            reviews,
          };
        },
        10,
      );

    return results;

  } catch (error) {
    console.error(
      `Failed to fetch PR reviews for ${user}/${repo}:`,
      error.message,
    );

    throw error;
  }
}


export async function fetchPRReviews(
  user,
  repo,
  githubToken,
  pullNumber,
) {
  const url =
    `https://api.github.com/repos/${user}/${repo}/pulls/${pullNumber}/reviews`;

  try {
    const response = await fetch(url, {
      headers: createHeaders(githubToken),
    });

    // CHANGE: Use shared response handler.
    // WHY: Review requests now properly recognize GitHub API failures.
    await handleGithubResponse(response, url);

    const data = await response.json();

    // CHANGE: Validate expected array response.
    // WHY: Review metrics expect an array, not an error/object response.
    if (!Array.isArray(data)) {
      throw new GithubApiError(
        "Expected GitHub reviews response to be an array",
        502,
      );
    }

    return data;

  } catch (error) {
    console.error(
      `Failed to fetch reviews for PR ${pullNumber} in ${user}/${repo}:`,
      error.message,
    );

    // CHANGE: Re-throw instead of returning { error: ... }.
    throw error;
  }
}


// ======================================================
// 9. PR / ISSUE COMMENTS
// GET /repos/{owner}/{repo}/issues/{issue_number}/comments
// ======================================================

export async function fetchPRComments(
  user,
  repo,
  githubToken,
  issueNumber,
) {
  const url =
    `https://api.github.com/repos/${user}/${repo}/issues/${issueNumber}/comments`;

  try {
    const response = await fetch(url, {
      headers: createHeaders(githubToken),
    });

    // CHANGE: Use shared response handler.
    // WHY: Comment requests now use consistent GitHub error handling.
    await handleGithubResponse(response, url);

    const data = await response.json();

    return data;

  } catch (error) {
    console.error(
      `Failed to fetch comments for issue ${issueNumber} in ${user}/${repo}:`,
      error.message,
    );

    // CHANGE: Re-throw instead of returning fake data.
    throw error;
  }
}


// ======================================================
// 10. ISSUES
// GET /repos/{owner}/{repo}/issues
// ======================================================

export async function fetchIssues(
  user,
  repo,
  githubToken,
) {
  const url =
    `https://api.github.com/repos/${user}/${repo}/issues?state=all`;

  try {
    return await fetchAllPages(
      url,
      githubToken,
    );

  } catch (error) {
    console.error(
      `Failed to fetch issues for ${user}/${repo}:`,
      error.message,
    );

    throw error;
  }
}


// ======================================================
// 11. INDIVIDUAL ISSUE
// GET /repos/{owner}/{repo}/issues/{issue_number}
// ======================================================

export async function fetchIndividualIssue(
  user,
  repo,
  githubToken,
  issueNumber,
) {
  const url =
    `https://api.github.com/repos/${user}/${repo}/issues/${issueNumber}`;

  try {
    const response = await fetch(url, {
      headers: createHeaders(githubToken),
    });

    // CHANGE: Use shared response handler.
    // WHY: Individual issue requests now use consistent API errors.
    await handleGithubResponse(response, url);

    const data = await response.json();

    return data;

  } catch (error) {
    console.error(
      `Failed to fetch issue ${issueNumber} for ${user}/${repo}:`,
      error.message,
    );

    // CHANGE: Re-throw instead of returning fake data.
    throw error;
  }
}


// ======================================================
// 12. ISSUE TIMELINE
// GET /repos/{owner}/{repo}/issues/{issue_number}/timeline
// ======================================================

export async function fetchIssueTimeline(
  user,
  repo,
  githubToken,
  issueNumber,
) {
  const url =
    `https://api.github.com/repos/${user}/${repo}/issues/${issueNumber}/timeline`;

  try {
    const response = await fetch(url, {
      headers: createHeaders(githubToken),
    });

    // CHANGE: Use shared response handler.
    // WHY: Timeline requests now get proper GitHub API errors.
    await handleGithubResponse(response, url);

    const data = await response.json();

    return data;

  } catch (error) {
    console.error(
      `Failed to fetch timeline for issue ${issueNumber} in ${user}/${repo}:`,
      error.message,
    );

    // CHANGE: Re-throw instead of returning fake data.
    throw error;
  }
}


// ======================================================
// 13. COLLABORATORS
// GET /repos/{owner}/{repo}/collaborators
// ======================================================

export async function fetchCollaborators(
  user,
  repo,
  githubToken,
) {
  const url =
    `https://api.github.com/repos/${user}/${repo}/collaborators`;

  try {
    const response = await fetch(url, {
      headers: createHeaders(githubToken),
    });

    // CHANGE: Use shared response handler.
    // WHY: Collaborator requests now have consistent error handling.
    await handleGithubResponse(response, url);

    const data = await response.json();

    return data;

  } catch (error) {
    console.error(
      `Failed to fetch collaborators for ${user}/${repo}:`,
      error.message,
    );

    // CHANGE: Re-throw instead of returning fake data.
    throw error;
  }
}


// ======================================================
// 14. LANGUAGES
// GET /repos/{owner}/{repo}/languages
// ======================================================

export async function fetchLanguages(
  user,
  repo,
  githubToken,
) {
  const url =
    `https://api.github.com/repos/${user}/${repo}/languages`;

  try {
    const response = await fetch(url, {
      headers: createHeaders(githubToken),
    });

    // CHANGE: Use shared response handler.
    // WHY: Language requests now use the same API error handling.
    await handleGithubResponse(response, url);

    const data = await response.json();

    return data;

  } catch (error) {
    console.error(
      `Failed to fetch languages for ${user}/${repo}:`,
      error.message,
    );

    throw error;
  }
}


// ======================================================
// 15. BRANCHES
// GET /repos/{owner}/{repo}/branches
// ======================================================

export async function fetchBranches(
  user,
  repo,
  githubToken,
) {
  const url =
    `https://api.github.com/repos/${user}/${repo}/branches`;

  try {
    const response = await fetch(url, {
      headers: createHeaders(githubToken),
    });

    // CHANGE: Use shared response handler.
    // WHY: Branch requests now have consistent GitHub API errors.
    await handleGithubResponse(response, url);

    const data = await response.json();

    return data;

  } catch (error) {
    console.error(
      `Failed to fetch branches for ${user}/${repo}:`,
      error.message,
    );

    // CHANGE: Re-throw instead of returning fake data.
    throw error;
  }
}


// ======================================================
// 16. FETCH USER REPOSITORIES
// GET /user/repos
// ======================================================

export async function fetchUserRepositories(
  githubToken,
) {
  const url = "https://api.github.com/user/repos";

  try {
    return await fetchAllPages(
      url,
      githubToken,
    );

  } catch (error) {
    console.error(
      "Failed to fetch user repositories:",
      error.message,
    );
    throw error;
  }
}
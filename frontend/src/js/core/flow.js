import { api, ApiError } from "./api.js";
import { GITHUB_ROUTES } from "./config.js";

/**
 * Figures out which page to send an authenticated user to:
 * - no GitHub account connected -> /connect.html
 * - connected but no repositories tracked yet -> /repositories.html
 * - otherwise -> /dashboard.html
 *
 * Uses GET /api/github/repositories/selected, which itself 404s with
 * "GitHub account is not connected" when there's no linked account —
 * that single call is enough to tell connected vs. not, and how many
 * repositories are already tracked.
 */
export async function resolvePostLoginDestination() {
  try {
    const data = await api.get(GITHUB_ROUTES.repositoriesSelected);
    const repos = data?.repositories || [];
    return repos.length > 0 ? "/dashboard.html" : "/repositories.html";
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return "/connect.html";
    }
    // Unknown failure: fall back to the dashboard, which will surface
    // the error itself rather than silently redirecting in a loop.
    return "/dashboard.html";
  }
}

// Central configuration. The API base URL comes from the environment so the
// same build can point at a local backend, staging, or production without
// code changes. Set VITE_API_BASE_URL in .env (see .env.example).
const rawBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const API_BASE_URL = rawBase.replace(/\/+$/, "");

export const AUTH_ROUTES = {
  register: "/api/auth/register",
  login: "/api/auth/login",
  protected: "/api/auth/protected",
};

export const GITHUB_ROUTES = {
  connect: "/api/github/connect",
  repositories: "/api/github/repositories",
  repositoriesSelect: "/api/github/repositories/select",
  repositoriesSelected: "/api/github/repositories/selected",
  repo: (owner, repo) => `/api/github/${owner}/${repo}`,
  forks: (owner, repo) => `/api/github/${owner}/${repo}/forks`,
  contributors: (owner, repo) => `/api/github/${owner}/${repo}/contributors`,
  commits: (owner, repo) => `/api/github/${owner}/${repo}/commits`,
  commit: (owner, repo, sha) => `/api/github/${owner}/${repo}/commit/${sha}`,
  pullRequests: (owner, repo) => `/api/github/${owner}/${repo}/pull-requests`,
  pullRequest: (owner, repo, number) =>
    `/api/github/${owner}/${repo}/pull-request/${number}`,
  pullRequestReviews: (owner, repo, number) =>
    `/api/github/${owner}/${repo}/pull-request/${number}/reviews`,
  pullRequestComments: (owner, repo, number) =>
    `/api/github/${owner}/${repo}/pull-request/${number}/comments`,
  issues: (owner, repo) => `/api/github/${owner}/${repo}/issues`,
  issue: (owner, repo, number) => `/api/github/${owner}/${repo}/issue/${number}`,
  issueTimeline: (owner, repo, number) =>
    `/api/github/${owner}/${repo}/issue/${number}/timeline`,
  collaborators: (owner, repo) => `/api/github/${owner}/${repo}/collaborators`,
  languages: (owner, repo) => `/api/github/${owner}/${repo}/languages`,
  branches: (owner, repo) => `/api/github/${owner}/${repo}/branches`,
};

export const METRICS_ROUTES = {
  full: (owner, repo) => `/api/metrics/${owner}/${repo}`,
};

export const STORAGE_KEYS = {
  token: "devmetrics_token",
  user: "devmetrics_user",
};

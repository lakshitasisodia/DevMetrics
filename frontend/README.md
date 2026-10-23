# DevMetrics — Frontend

A dark, tech-focused dashboard for the DevMetrics backend: connect a GitHub
account, pick repositories to track, and see commit, pull request, review,
and issue metrics for each one.

Vanilla JavaScript, Vite (multi-page, no SPA router/framework), Tailwind CSS v4.

## 1. Requirements

- Node.js 18+
- The DevMetrics backend running and reachable (see below)

## 2. Setup

```bash
npm install
cp .env.example .env
```

Open `.env` and point it at your backend:

```
VITE_API_BASE_URL=http://localhost:5000
```

This is the **only** place a backend URL is configured. No URLs are
hardcoded anywhere in the source — every request goes through
`src/js/core/config.js`, which reads `VITE_API_BASE_URL`.

## 3. Run

```bash
npm run dev
```

Opens on `http://localhost:5173`. Make sure your backend's CORS
configuration allows requests from this origin (and from wherever you
deploy the built frontend).

## 4. Build

```bash
npm run build   # outputs to dist/
npm run preview # serve the production build locally to sanity-check it
```

`dist/` is a static site — deploy it to any static host (Vercel, Netlify,
S3 + CloudFront, nginx, etc.), and set `VITE_API_BASE_URL` at build time
for that environment.

## 5. How it maps to the backend

This frontend was built directly from your Express routes — every screen
calls a real endpoint, nothing is mocked or invented. Route mount paths
are **assumed** to be `/api/auth`, `/api/github`, and `/api/metrics`
(matching the pattern in `metricsRoute.js`'s comments and the export
shape of the other route files); update `src/js/core/config.js` if your
`server.js` mounts them differently.

| Page | Backend calls |
|---|---|
| `index.html` (Login) | `POST /api/auth/login` |
| `register.html` | `POST /api/auth/register` |
| `connect.html` | `POST /api/github/connect` |
| `repositories.html` | `GET /api/github/repositories`, `GET /api/github/repositories/selected`, `POST /api/github/repositories/select` |
| `dashboard.html` | `GET /api/github/repositories/selected`, `GET /api/metrics/:owner/:repo` (per tracked repo) |
| `repo.html` — Overview tab | `GET /api/metrics/:owner/:repo` |
| `repo.html` — Commits tab | `GET /api/github/:owner/:repo/commits` |
| `repo.html` — Pull requests tab | `GET /api/github/:owner/:repo/pull-requests`, `GET /api/github/:owner/:repo/pull-request/:number/reviews` (on row expand) |
| `repo.html` — Issues tab | `GET /api/github/:owner/:repo/issues` |
| `repo.html` — Contributors tab | `GET /api/github/:owner/:repo/contributors` |
| `repo.html` — Languages tab | `GET /api/github/:owner/:repo/languages` |
| `repo.html` — Branches tab | `GET /api/github/:owner/:repo/branches` |
| `repo.html` — Collaborators tab | `GET /api/github/:owner/:repo/collaborators` |

### Auth flow

- JWT returned by `/api/auth/login` is stored in `localStorage` and sent
  as `Authorization: Bearer <token>` on every request via
  `src/js/core/api.js`.
- Protected pages call `requireAuth()` (`src/js/core/session.js`) before
  rendering anything, and redirect unauthenticated visitors to
  `index.html?next=<page>` so they land back where they started after
  logging in.
- A `401` response anywhere clears the local session automatically, so a
  stale/expired token can't strand the user on a broken page.
- After login, `resolvePostLoginDestination()`
  (`src/js/core/flow.js`) calls `GET /api/github/repositories/selected`
  once to decide where to send the person: no GitHub account connected →
  `connect.html`; connected but nothing tracked yet → `repositories.html`;
  otherwise → `dashboard.html`.

### Things worth knowing before you wire this to production

- **No "disconnect GitHub account" or "untrack repository" endpoint
  exists in the backend you provided**, so the UI doesn't offer those
  actions — adding them is a backend change, not a frontend one.
- **Duration fields** in the metrics response (`averagePRCycleTime`,
  `medianPRCycleTime`, `longestPRCycleTime`, `averageTimeToFirstReview`,
  `averageResolutionTime`, `medianResolutionTime`) are rendered assuming
  they're expressed in **hours**, consistent with the field naming — if
  your metrics engine reports different units, update
  `formatDurationHours()` in `src/js/core/format.js`.
- **`metrics.developers`** isn't part of the validated response contract
  in `index.js` (`validateMetrics` doesn't check it), so its shape isn't
  guaranteed. The Overview tab renders whatever comes back — array, or a
  map keyed by developer — generically, rather than assuming field names
  that may not exist. Once you know the exact shape, `renderDevelopers()`
  in `src/js/pages/repo/overview.js` is the place to make it more specific.
- `GET /api/github/repositories` (the "available to track" list) calls
  GitHub's `/user/repos` without pagination on the backend, so accounts
  with a very large number of repositories will only see the first page
  here — that's a backend behavior, not something the frontend works
  around.

## 6. Project structure

```
index.html              Login
register.html            Register
connect.html              Connect GitHub account
repositories.html         Track / browse repositories
dashboard.html            Tracked repositories + at-a-glance metrics
repo.html                 Repository detail (tabbed metrics + explorer)

src/
  css/main.css             Tailwind v4 theme + design tokens
  js/
    core/
      config.js            Route map + env-driven API base URL
      api.js                Fetch wrapper: auth header, JSON, error shape
      session.js            Token/user storage, route guards
      flow.js               Post-login routing decision
      format.js             Number/date/duration formatting
    components/
      navbar.js             App shell top nav
      toast.js               Toast notifications
      states.js              Loading / error / empty state markup
    charts/
      bar-chart.js           Dependency-free inline SVG bar + ring charts
    pages/
      login.js, register.js, connect.js, repositories.js, dashboard.js
      repo.js                 Tab shell for the repository detail page
      repo/overview.js        Overview tab (full metrics)
      repo/explorer.js        Commits/PRs/Issues/Contributors/Languages/
                               Branches/Collaborators tabs
```

## 7. SEO

- Unique `<title>` and meta description per page, canonical URLs, Open
  Graph basics on the public login/register pages.
- Authenticated app pages (`connect`, `repositories`, `dashboard`,
  `repo`) are marked `noindex, nofollow` since there's nothing for a
  search engine to usefully index behind a login.
- Semantic HTML (`header`, `main`, `nav`, `section`, headings in order)
  throughout, and a `favicon.svg`.

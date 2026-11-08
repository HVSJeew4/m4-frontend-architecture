# Month 4 – Frontend Architecture: AdminFlow Dashboard

## Overview

AdminFlow is a single-page admin dashboard for a SaaS platform: sign-in with protected routes, a
metrics dashboard, user management (CRUD), debounced search and notifications, with dark mode.
It is built for WCAG 2.1 AA, Lighthouse Performance 90+ and mobile-first layouts, with a
Storybook component library.

There is no backend in the brief, so the app talks to a **mock REST API** (MSW) that runs in the
browser. The app makes real `fetch` calls, so a real API could replace the mock without changing
the components.

| Document | What |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | Architecture decisions: state, routing, data, components, theming, performance, trade-offs |
| [`docs/accessibility.md`](docs/accessibility.md) | Accessibility audit (WCAG 2.1 AA) |
| [`docs/lighthouse/lighthouse-report.pdf`](docs/lighthouse/lighthouse-report.pdf) | Lighthouse report (summary + full reports) |
| [`docs/PLAN.md`](docs/PLAN.md) / [`docs/CHALLENGE.md`](docs/CHALLENGE.md) | Plan and brief |

**Results:** Lighthouse Performance **98 / 94 / 93** on mobile and **100** on desktop
(login / dashboard / users, median of 3 runs); Lighthouse accessibility 100 everywhere; 0 axe
violations in 32 page runs and 66 story runs (light + dark); 173 tests.

## Tech Stack

| Concern | Choice |
|---|---|
| Build | Vite 8 |
| UI | React 18.3 + TypeScript 6.0 (strict) |
| Routing | React Router 6.30 |
| Server state | TanStack Query 5 |
| Client state | Zustand 5 |
| Forms | React Hook Form 7 + Zod 4 |
| Styling | Tailwind CSS 4 (dark mode) |
| Mock API | MSW 3 (browser, tests and Storybook) |
| Virtual list | TanStack Virtual 3 |
| Chart | Hand-written SVG (replaced Recharts – see Design Decisions) |
| Tests | Vitest 5, React Testing Library, user-event, axe-core |
| Lint/format | ESLint 9 (typescript-eslint, react-hooks, jsx-a11y, storybook), Prettier |
| Components | Storybook 10 with the a11y addon and a light/dark toolbar |
| Audits | Lighthouse 13 and axe-core in Chrome via puppeteer-core (scripts) |

All versions are pinned exactly in `package.json`. Two are deliberately not the newest:
TypeScript 6.0 (typescript-eslint does not support 7 yet) and ESLint 9 (eslint-plugin-jsx-a11y
does not support 10 yet).

## Getting Started

Requirements: Node 22.19+ (developed on Node 26 / npm 11). The audit scripts use an installed
Chrome or Edge (or set `CHROME_PATH`).

```bash
npm install
npm run dev          # http://localhost:5173
```

npm 11 blocks dependency install scripts. Only `esbuild`'s is affected; it is not needed because
the prebuilt `@esbuild/win32-x64` binary is installed as a normal dependency.

No environment variables are needed (there is no `.env`).

**Demo sign-in:** `admin@adminflow.test` or `editor@adminflow.test` with **any password of 8+
characters**. `user@adminflow.test` exists to show the "no admin access" error. No password is
stored anywhere – the mock only checks the length.

### Mock API

The mock API starts on the first API request and keeps its data in `localStorage`, so changes
survive a reload. Add these to the page URL to see other states:

| URL parameter | Effect |
|---|---|
| `?mock-latency=1500` | Responses take 1.5 s (default 400 ms) – shows loading states |
| `?mock-fail=users,metrics` | Those endpoint groups answer 500 – shows error states (`all` = every group) |
| `?mock-reset` | Back to the seed data |
| `?mock-users=10000` | New data with that many users (max 20,000) – try Users → "All users" (virtual list) |

Groups: `auth`, `users`, `metrics`, `activity`, `notifications`.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type check, then production build into `dist/` |
| `npm run preview` | Serve the production build (http://localhost:4173) |
| `npm run typecheck` | TypeScript only |
| `npm run lint` | ESLint, then Prettier check |
| `npm run format` | Prettier write |
| `npm test` | All tests once |
| `npm run test:watch` | Tests in watch mode |
| `npm run storybook` | Storybook dev server (http://localhost:6006) |
| `npm run build-storybook` | Static Storybook into `storybook-static/` |
| `npm run a11y` | Real-browser accessibility audit (needs `build` and `build-storybook` first) |
| `npm run lighthouse` | Lighthouse report, mobile + desktop (needs `build` first; a few minutes) |
| `npm run submission` | Builds Storybook and the 5 deliverables into `submission/` (commit first) |

## Running Tests

```bash
npm test
```

Tests run in jsdom with MSW in Node mode, so they use the same mock API as the browser. Each test
starts from fresh seed data with no latency. Any request without a mock handler fails the test.
173 tests in 28 files:

| File | What it covers |
|---|---|
| `src/App.test.tsx` | App shell: routing, active nav link, skip link, mobile nav toggle, 404, axe |
| `src/components/layout/routeAnnouncer.test.tsx` | Page titles; focus moves to the new heading after navigation, not on first load |
| `src/components/layout/themeToggle.test.tsx` | Dark mode toggle (`aria-pressed`), follows the system setting |
| `src/components/features/auth/auth.test.tsx` | Redirect to `/login` and back, login validation and server errors, sign-out clears the cache |
| `src/components/features/users/users.test.tsx` | Paging, sorting (`aria-sort`), role filter, debounced search (one request), create, server error alert, optimistic edit + rollback, delete + Undo, error + retry, axe |
| `src/components/features/users/userForm.test.tsx` | Focus on first invalid field, 409 on the Email field, email normalised, PATCH with only changed fields, no request when unchanged, "Discard changes?" guard |
| `src/components/features/users/usersDirectory.test.tsx` | "All users" virtual list view, kept in the URL, with filters |
| `src/components/features/dashboard/*.test.tsx` | Metric cards, range tabs + data table, activity, partial failure, axe; the SVG chart and its axis scale |
| `src/components/features/notifications/notifications.test.tsx` | Bell unread count, panel, mark read / all read, toasts |
| `src/stores/*.test.ts` | Auth (login/logout, `sessionStorage`, token, 401) and theme store |
| `src/hooks/useDebounce.test.ts` | Debounce timing with fake timers |
| `src/schemas/userSchema.test.ts` | The brief's schema rules plus trimming / lower-casing, and `loginSchema` |
| `src/utils/*.test.ts` | Safe post-login redirect, formatting |
| `src/components/common/*.test.tsx` | The library components incl. VirtualList (roles, keyboard, focus trap, axe) |
| `src/mocks/*.test.ts` | Mock API contract, URL switches, large data sets |

Accessibility in tests uses `axe-core` through `src/test/axe.ts`. Colour contrast is skipped there
because jsdom does not compute styles; `npm run a11y` checks it in Chrome, in both themes.

In every part the first failing tests were committed on their own (`test: failing test for …`)
before the code that makes them pass.

### Accessibility and performance audits

```bash
npm run build && npm run build-storybook
npm run a11y         # axe (WCAG 2.1 AA) on every page and dialog, light + dark, phone + desktop;
                     # reflow at 320 px / 200 % zoom; keyboard walk; every Storybook story
npm run lighthouse   # median of 3 runs per page → docs/lighthouse/summary.json + lighthouse-report.pdf
```

## Project Structure

```
src/
├── api/              # fetch client (ApiError, token) + React Query hooks per resource
├── components/
│   ├── common/       # The component library: Button, Input, Select, Modal, Card, Table, Alert, Tabs, VirtualList, … + stories
│   ├── layout/       # AppLayout, Header, Sidebar, SkipLink, PageHeading, ThemeToggle
│   └── features/     # auth, dashboard, users, notifications
├── hooks/            # useDebounce, useTheme, useElementWidth, useClearCacheOnSignOut
├── mocks/            # MSW mock API: handlers, seed data, localStorage "db", config
├── pages/            # Route pages (Login, Dashboard, Users, Notifications, NotFound)
├── schemas/          # Zod schemas (userSchema from the brief, loginSchema)
├── stores/           # Zustand: authStore, notificationStore (toasts), uiStore (theme)
├── test/             # Test setup and helpers
├── types/            # Shared TypeScript types (API contract)
├── utils/            # format, safeRedirect, niceCeil, cn, router future flags
├── App.tsx           # Routes (pages lazy-loaded, login eager)
└── main.tsx          # Providers, mock API on first request, renders the app
.storybook/           # Storybook config (theme toolbar) and introduction page
scripts/              # a11y-audit, lighthouse, package-submission (+ lib/browser.mjs)
docs/                 # plan, brief, rubric, architecture, accessibility, a11y/ and lighthouse/ results
public/               # Static files: MSW's generated mockServiceWorker.js, robots.txt, favicon
```

`api/`, `mocks/`, `schemas/` and `test/` are additions to the brief's structure. `schemas/` is
named in the brief's own example (`schemas/userSchema.ts`).

## Design Decisions

The full reasoning is in [`docs/architecture.md`](docs/architecture.md). In short:

- **Three kinds of state, three homes:** server data in React Query; shared client state (session,
  toasts, theme) in Zustand; view state worth keeping (page, sort, filters, search, view) in the URL.
- **Mock API with MSW**, started on the first API request: real fetch, loading and error behaviour;
  the same handlers in the browser, tests and Storybook; the login page never loads it.
- **Session in `sessionStorage`**, 401 → "session expired", cache cleared on sign-out; post-login
  redirect only to plain in-app paths (covers the React Router v6 advisory).
- **Optimistic edit** (rolled back on error), server-confirmed create, **soft delete with Undo**;
  edits send only the changed fields.
- **Forms:** Zod schemas as the single source of rules, server field errors on the field,
  "Discard changes?" guard, Save never disabled.
- **Accessible library:** hand-built Modal with an explicit focus trap and `inert` background,
  roving-tabindex Tabs, native `<select>`, `aria-sort` table, virtual list with `aria-setsize`.
  Page titles and focus on navigation; skip link; live regions for counts and toasts.
- **Dark mode** with theme tokens (reversed slate scale + named tokens), no flash on load, toggle
  with `aria-pressed`; contrast verified in both themes.
- **Performance by measurement:** route-level code splitting; first render in `startTransition`;
  **Recharts replaced by a ~150-line SVG chart** after measuring that it cost ~10 mobile Lighthouse
  points; layout shifts removed; virtual list for 10,000+ users.
- **Seeded data instead of Faker**, money in cents, system font stack.

## Challenge Coverage

- [x] Part 1 – Application setup (Vite, React 18, TypeScript, Router v6, React Query, Zustand,
      React Hook Form + Zod, Tailwind, mock API, Storybook, layout shell)
- [x] Part 2 – Core features: authentication with protected routes, dashboard (metrics, trend
      chart, activity, quick actions), user CRUD (pagination, sorting, filtering, optimistic edit,
      soft delete with Undo), debounced search, notifications (toasts + notification centre),
      loading/empty/error states, all 8 Storybook components
- [x] Part 3 – Forms & validation: the brief's `userSchema` (plus trimming and lower-case email)
      and `loginSchema` with React Hook Form + `zodResolver`; accessible errors (`aria-invalid`,
      `aria-describedby`, focus on the first invalid field); server field errors on the field;
      "Discard changes?" guard; edit sends only changed fields
- [x] Part 4 – Accessibility & performance: code splitting, virtual list with `memo` rows, page
      titles and focus management, dark mode (bonus), real-browser axe audit + keyboard + reflow
      checks, Lighthouse 90+ on mobile, accessibility audit, architecture document, submission script

## Known Limitations

- **Screen-reader testing (NVDA) is not done yet** – the checklist is in `docs/accessibility.md` §6.
- **React Router v6 advisory:** `npm audit` reports an open-redirect issue with backslash paths in
  `<Link>`/`useNavigate` (and an SSR issue that does not apply to this SPA). The only fix is v7, but
  the brief requires v6. The post-login redirect accepts only plain `/path` values.
- **typescript-eslint → minimatch advisory:** denial of service through crafted glob patterns, in a
  dev-only lint tool that only sees our own patterns. Accepted.
- **Token in `sessionStorage`** can be read by any script on the page (XSS). A real backend should
  use an `HttpOnly` cookie instead; with a browser-only mock this is not possible.
- **Mock data is per browser** (localStorage); there is no real security behind the mock API.
- **Lighthouse mobile scores vary** by a few points between runs on the same build; the report uses
  the median of 3 runs and lists every score.
- **"All users" view** uses the sort chosen in the table view; it has no sort control of its own.

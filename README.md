# Month 4 – Frontend Architecture: AdminFlow Dashboard

## Overview

AdminFlow is a single-page admin dashboard for a SaaS platform: sign-in with protected routes, a
metrics dashboard, user management (CRUD), debounced search and notifications. It is built for
WCAG 2.1 AA, Lighthouse Performance 90+ and mobile-first layouts, with a Storybook component library.

There is no backend in the brief, so the app talks to a **mock REST API** (MSW) that runs in the
browser. The app makes real `fetch` calls, so swapping in a real API would only change the base URL.

Plan and progress: [`docs/PLAN.md`](docs/PLAN.md). Brief: [`docs/CHALLENGE.md`](docs/CHALLENGE.md).

## Tech Stack

| Concern | Choice |
|---|---|
| Build | Vite 8 |
| UI | React 18.3 + TypeScript 6.0 (strict) |
| Routing | React Router 6.30 |
| Server state | TanStack Query 5 |
| Client state | Zustand 5 |
| Forms | React Hook Form 7 + Zod 4 |
| Styling | Tailwind CSS 4 |
| Mock API | MSW 3 (browser, tests and Storybook) |
| Chart | Recharts 3 (lazy-loaded) |
| Tests | Vitest 5, React Testing Library, user-event, axe-core |
| Lint/format | ESLint 9 (typescript-eslint, react-hooks, jsx-a11y, storybook), Prettier |
| Components | Storybook 10 with the a11y addon |

All versions are pinned exactly in `package.json`. Two are deliberately not the newest:
TypeScript 6.0 (typescript-eslint does not support 7 yet) and ESLint 9 (eslint-plugin-jsx-a11y
does not support 10 yet).

## Getting Started

Requirements: Node 22+ (developed on Node 26 / npm 11).

```bash
npm install
npm run dev          # http://localhost:5173
```

npm 11 blocks dependency install scripts. Only `esbuild`'s is affected; it is not needed because
the prebuilt `@esbuild/win32-x64` binary is installed as a normal dependency.

No environment variables are needed (there is no `.env`).

### Mock API

The mock API starts before the app renders and keeps its data in `localStorage`, so changes survive
a reload. Add these to the page URL to see other states:

| URL parameter | Effect |
|---|---|
| `?mock-latency=1500` | Responses take 1.5 s (default 400 ms) – shows loading states |
| `?mock-fail=users,metrics` | Those endpoint groups answer 500 – shows error states (`all` = every group) |
| `?mock-reset` | Back to the seed data |

Groups: `auth`, `users`, `metrics`, `activity`, `notifications`.

**Demo sign-in:** `admin@adminflow.test` or `editor@adminflow.test` with **any
password of 8+ characters**. `user@adminflow.test` exists to show the "no admin access" error. No
password is stored anywhere – the mock only checks the length.

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

## Running Tests

```bash
npm test
```

Tests run in jsdom with MSW in Node mode, so they use the same mock API as the browser. Each test
starts from fresh seed data with no latency. Any request without a mock handler fails the test.
125 tests in 19 files:

| File | What it covers |
|---|---|
| `src/App.test.tsx` | App shell: routing, active nav link, skip link, mobile nav toggle, 404, axe |
| `src/components/features/auth/auth.test.tsx` | Redirect to `/login` and back, login validation and server errors, sign-out clears the cache |
| `src/components/features/users/users.test.tsx` | Paging, sorting (`aria-sort`), role filter, debounced search (one request), create, duplicate email, optimistic edit + rollback, delete + Undo, error + retry, axe |
| `src/components/features/dashboard/dashboard.test.tsx` | Metric cards, range tabs + data table, activity, partial failure, axe |
| `src/components/features/notifications/notifications.test.tsx` | Bell unread count, panel, mark read / all read, toasts |
| `src/stores/authStore.test.ts` | Login/logout, `sessionStorage`, token on requests, 401 → session expired |
| `src/hooks/useDebounce.test.ts` | Debounce timing with fake timers |
| `src/utils/*.test.ts` | Safe post-login redirect, formatting |
| `src/components/common/*.test.tsx` | The 8 library components (roles, keyboard, focus trap, axe) |
| `src/mocks/*.test.ts` | Mock API contract and URL switches |

Accessibility in tests uses `axe-core` through `src/test/axe.ts`. Colour contrast is skipped there
because jsdom does not compute styles; it is checked in a real browser (Storybook a11y addon, Lighthouse).
For the same reason the Recharts chart is replaced by an empty stub in tests (`src/test/setup.ts`);
its data is tested through the chart's data table.

The first failing tests were committed on their own (`test: failing test for …`) before the code.

## Project Structure

```
src/
├── api/              # fetch client (ApiError, token) + React Query hooks per resource
├── components/
│   ├── common/       # The component library: Button, Input, Select, Modal, Card, Table, Alert, Tabs, … + stories
│   ├── layout/       # AppLayout, Header, Sidebar, SkipLink
│   └── features/     # auth, dashboard, users, notifications
├── hooks/            # useDebounce, useClearCacheOnSignOut
├── mocks/            # MSW mock API: handlers, seed data, localStorage "db", config
├── pages/            # Route pages (Login, Dashboard, Users, Notifications, NotFound)
├── schemas/          # Zod schemas (userSchema from the brief, loginSchema)
├── stores/           # Zustand: authStore, notificationStore (toasts)
├── test/             # Test setup and helpers
├── types/            # Shared TypeScript types (API contract)
├── utils/            # format, safeRedirect, cn, router future flags
├── App.tsx           # Routes
└── main.tsx          # Providers, starts the mock API, renders the app
.storybook/           # Storybook config and introduction page
public/               # Static files, including MSW's generated mockServiceWorker.js
```

`api/`, `mocks/`, `schemas/` and `test/` are additions to the brief's structure. `schemas/` is
named in the brief's own example (`schemas/userSchema.ts`).

## Design Decisions

- **Mock API with MSW instead of hard-coded data.** Components fetch through React Query exactly
  as they would against a real server, so loading, error and caching behaviour is real. The same
  handlers serve the browser, the tests and Storybook.
- **Seeded random generator instead of Faker.** The mock runs in the production build, so Faker
  would add hundreds of KB to what users download (bad for Lighthouse). A 10-line seeded generator
  gives the same data on every fresh start.
- **Money in cents** (`revenueCents`) to avoid floating-point rounding.
- **Providers in `main.tsx`, routes in `App.tsx`**, so tests render `<App />` with their own router
  and a fresh query cache.
- **Accessible layout from the start:** skip link, landmarks (`header`, `nav`, `main`), the menu
  button reports `aria-expanded`, and the active link gets `aria-current="page"` (from `NavLink`).
- **System font stack** – no web-font download.
- **Three kinds of state, three homes.** Server data (users, metrics, notifications) lives in React
  Query, which caches, refetches and tracks loading/error. Client state that several components
  share (the session, toasts) lives in Zustand. View state that should survive a reload (users
  page, sort, filters, search) lives in the URL.
- **Session in `sessionStorage`:** survives a reload, ends with the tab. Reads are synchronous, so
  a reload never flashes the login page. A 401 from any request signs out with a "session expired" message.
- **Safe post-login redirect:** only plain in-app paths are accepted (`utils/safeRedirect.ts`),
  which also covers the React Router v6 backslash advisory.
- **Optimistic edit:** the row changes in every cached page immediately, and is rolled back with an
  error toast if the server refuses. Create waits for the server, because it needs the new id.
- **Soft delete with Undo** instead of "Are you really sure?" twice: one confirmation, then a toast
  with Undo that stays 10 s (and pauses while hovered or focused).
- **Hand-built Modal with an explicit focus trap** (the brief asks for one), plus `inert` on the
  rest of the page and focus returned to the trigger.
- **Native `<select>`** for single and multi-select: accessible on every device for free.
- **Chart loaded on demand** (`React.lazy`): Recharts (~109 KB gzipped) never loads on the login page.
  A data table next to the chart is its text alternative.
- **Requests wait for the mock API, the page does not:** `setApiReady()` in `main.tsx`.

## Challenge Coverage

- [x] Part 1 – Application setup (Vite, React 18, TypeScript, Router v6, React Query, Zustand,
      React Hook Form + Zod, Tailwind, mock API, Storybook, layout shell)
- [x] Part 2 – Core features: authentication with protected routes, dashboard (metrics, trend
      chart, activity, quick actions), user CRUD (pagination, sorting, filtering, optimistic edit,
      soft delete with Undo), debounced search, notifications (toasts + notification centre),
      loading/empty/error states, all 8 Storybook components
- [ ] Part 3 – Forms & validation
- [ ] Part 4 – Accessibility & performance

## Known Limitations

- **React Router v6 advisory:** `npm audit` reports an open-redirect issue with backslash paths in
  `<Link>`/`useNavigate` (and an SSR issue that does not apply to this SPA). The only fix is v7, but
  the brief requires v6. The post-login redirect will accept only plain `/path` values.
- **typescript-eslint → minimatch advisory:** denial of service through crafted glob patterns, in a
  dev-only lint tool that only sees our own patterns. Accepted.
- **MSW in the production build:** needed because there is no backend. Its browser chunk is about
  155 KB gzipped; only API requests wait for it, not the first render.
- **Main bundle is 116 KB gzipped** after Part 2 (all pages in one chunk). Route-level code
  splitting is planned for Part 4.
- **Token in `sessionStorage`** can be read by any script on the page (XSS). A real backend should
  use an `HttpOnly` cookie instead; with a browser-only mock this is not possible.
- **The chart is not unit-tested** (jsdom cannot draw it); its data is tested via the data table.

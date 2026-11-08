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

**Demo sign-in** (used from Part 2): `admin@adminflow.test` or `editor@adminflow.test` with **any
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

| File | What it covers |
|---|---|
| `src/App.test.tsx` | App shell: routing, active nav link, skip link, mobile nav toggle, 404, axe |
| `src/mocks/handlers.test.ts` | Mock API contract: auth, users (paging, sorting, filters, search, CRUD, soft delete), metrics, notifications, forced failures |
| `src/mocks/config.test.ts` | URL parameters for latency, failures and reset |

Accessibility in tests uses `axe-core` through `src/test/axe.ts`. Colour contrast is skipped there
because jsdom does not compute styles; it is checked in a real browser (Storybook a11y addon, Lighthouse).

## Project Structure

```
src/
├── api/              # React Query client (API hooks from Part 2)
├── components/
│   ├── common/       # Reusable components + stories (Part 2+)
│   ├── layout/       # AppLayout, Header, Sidebar, SkipLink
│   └── features/     # Feature-specific components (Part 2+)
├── hooks/            # Custom hooks (Part 2+)
├── mocks/            # MSW mock API: handlers, seed data, localStorage "db", config
├── pages/            # Route pages
├── stores/           # Zustand stores (Part 2+)
├── test/             # Test setup and helpers
├── types/            # Shared TypeScript types (API contract)
├── utils/            # Utilities
├── App.tsx           # Routes
└── main.tsx          # Providers, starts the mock API, renders the app
.storybook/           # Storybook config and introduction page
public/               # Static files, including MSW's generated mockServiceWorker.js
```

`api/`, `mocks/` and `test/` are additions to the brief's structure. `schemas/` follows in Part 3.

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

## Challenge Coverage

- [x] Part 1 – Application setup (Vite, React 18, TypeScript, Router v6, React Query, Zustand,
      React Hook Form + Zod, Tailwind, mock API, Storybook, layout shell)
- [ ] Part 2 – Core features
- [ ] Part 3 – Forms & validation
- [ ] Part 4 – Accessibility & performance

## Known Limitations

- **React Router v6 advisory:** `npm audit` reports an open-redirect issue with backslash paths in
  `<Link>`/`useNavigate` (and an SSR issue that does not apply to this SPA). The only fix is v7, but
  the brief requires v6. The post-login redirect will accept only plain `/path` values.
- **typescript-eslint → minimatch advisory:** denial of service through crafted glob patterns, in a
  dev-only lint tool that only sees our own patterns. Accepted.
- **MSW in the production build:** needed because there is no backend. Its browser chunk is about
  155 KB gzipped; Part 2 stops the first render from waiting for it.

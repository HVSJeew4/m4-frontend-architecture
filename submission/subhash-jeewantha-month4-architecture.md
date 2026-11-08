# AdminFlow – Architecture Decisions

AdminFlow is a single-page admin dashboard (React 18 + TypeScript) with sign-in, a metrics
dashboard, user management, debounced search and notifications. This document explains how it is
built and why, including the alternatives that were considered.

## 1. Stack

| Concern | Choice | Why |
|---|---|---|
| Build | Vite 8 | Required by the brief; fast dev server, code splitting out of the box |
| UI | React 18.3 + TypeScript 6.0 (strict, `noUncheckedIndexedAccess`) | Required by the brief. TypeScript 6.0, not 7: typescript-eslint does not support 7 yet |
| Routing | React Router 6.30 with the v7 future flags | Required (v6). Future flags opt in to v7 behaviour now |
| Server state | TanStack Query 5 | Caching, loading/error state, retries, optimistic updates |
| Client state | Zustand 5 | Small API, no providers; the brief's own example is `useAuthStore()` |
| Forms | React Hook Form 7 + Zod 4 | Required; uncontrolled inputs (few re-renders), one schema for types and rules |
| Styling | Tailwind CSS 4 | No runtime CSS-in-JS cost; mobile-first breakpoints; `dark:` variant |
| Mock backend | MSW 3 | Real `fetch` calls answered in the browser, in Node (tests) and in Storybook |
| Virtual list | TanStack Virtual 3 | Headless, small, matches the brief's `VirtualList` API |
| Tests | Vitest 5, Testing Library, user-event, axe-core | Same config as Vite; tests use the app the way users do |
| Components | Storybook 10 with the a11y addon | The brief's component library |

All versions are pinned exactly (`package.json`).

## 2. Folder structure

The brief's structure, plus four folders it does not name:

```
src/
├── api/          # fetch client + React Query hooks per resource (users, dashboard, notifications, auth)
├── components/
│   ├── common/   # the reusable library (9 components + stories + tests)
│   ├── layout/   # AppLayout, Header, Sidebar, SkipLink, PageHeading, ThemeToggle
│   └── features/ # auth, dashboard, users, notifications – components that know about one feature
├── hooks/        # generic hooks: useDebounce, useTheme, useElementWidth, useClearCacheOnSignOut
├── mocks/        # MSW handlers, seed data, localStorage "db", URL switches
├── pages/        # one component per route
├── schemas/      # Zod schemas (the brief names schemas/userSchema.ts)
├── stores/       # Zustand: authStore, notificationStore, uiStore
├── test/         # test setup and helpers
├── types/        # shared types = the API contract
└── utils/        # pure functions: format, safeRedirect, niceCeil, cn
```

Rule of thumb: `common/` components know nothing about users or metrics (they are reusable and
have stories); `features/` components may use API hooks and stores; `pages/` compose features.

## 3. State management

State lives in one of three places, chosen by **who owns it**:

| Kind | Where | Examples | Why there |
|---|---|---|---|
| Server state | React Query cache | users list, metrics, notifications | The server owns it; the client keeps a cache that can go stale. React Query handles caching, refetching, loading/error and retries |
| Shared client state | Zustand stores | session (`authStore`), toasts (`notificationStore`), theme (`uiStore`) | Owned by the browser and needed in many places (header, pages, API client) |
| View state worth sharing | The URL | users page, sort, filters, search, view (`?view=all`), create dialog (`?new=1`) | Survives reload, works with Back/Forward, can be shared as a link; also the React Query key |

Local `useState` is used for the rest (which dialog is open, input text before debouncing).

**Why Zustand, not Redux Toolkit.** The client state is small (three stores, a few fields each).
Zustand needs no provider, no actions/reducers boilerplate, and supports `persist` (sessionStorage
for the session, localStorage for the theme) and `subscribe` outside React. Server data — the
largest part of the state — is in React Query either way, which is where RTK Query would have
competed.

**Stores**

- `authStore` – the brief's `AuthState` (`user`, `token`, `isLoading`, `login`, `logout`) plus
  `error` and `expireSession`. Persisted to **sessionStorage**: survives a reload, ends with the tab;
  reads are synchronous, so a reload never flashes the login page.
- `notificationStore` – toasts (max 4; 5 s, or 10 s when they have an Undo button).
- `uiStore` – the theme (`system` until the user chooses), persisted to **localStorage**.

**React Query patterns**

- Query keys from factories (`userKeys.list(params)`), so related queries can be invalidated together.
- `keepPreviousData` on lists: the current page stays visible while the next loads.
- Retry once for network/5xx errors, never for 4xx.
- **Optimistic edit:** `onMutate` updates every cached list that contains the user, keeps a
  snapshot, and `onError` restores it; `onSettled` refetches. Create waits for the server (the new
  row needs the server's id). Mark-as-read is optimistic too.
- Edits send **only the changed fields**, so they cannot overwrite another admin's change to a
  different field.
- On sign-out (or a 401) the whole cache is cleared (`useClearCacheOnSignOut`), so the next person
  on the same browser never sees the previous admin's data.

## 4. Routing and authentication

- Routes: `/login` (eager), and inside `ProtectedRoute` + `AppLayout`: `/dashboard`, `/users`,
  `/notifications`, `*` (lazy chunks).
- `ProtectedRoute` (the brief's component) redirects to `/login` and remembers the page; after
  sign-in the user goes back there – but only to a **plain in-app path** (`utils/safeRedirect.ts`).
  That blocks open redirects, including React Router v6's backslash advisory (`/\evil.com`).
- The API client sends `Authorization: Bearer <token>`; any 401 on an authenticated request signs
  the user out with "Your session has expired".
- The client gets the token through `configureApiAuth()` instead of importing the store, because
  the store itself uses the client to sign in (a circular import otherwise).
- Every page has a `PageHeading`: it sets `document.title` and, after an in-app navigation, moves
  focus to the new `h1` (not on the first load, and not when only the query string changes).

## 5. Data layer and the mock API

There is no backend in the brief, so the app runs against a mock REST API built with **MSW**:

- The app makes real `fetch` requests (`src/api/client.ts`); MSW answers them in a service worker.
  Replacing the mock with a real API would only mean not starting MSW.
- The same handlers answer in tests (`msw/node`) and in Storybook (`msw-storybook-addon`).
- Data comes from a seeded generator (`mocks/data/seed.ts`, no Faker – it would add hundreds of KB to
  the production bundle) and is kept in localStorage, so changes survive a reload.
- URL switches: `?mock-latency=1500`, `?mock-fail=users,metrics`, `?mock-reset`, `?mock-users=10000`.
- **MSW starts on the first API request**, not on page load (`setBeforeFirstRequest`): the login page
  makes no request until "Sign in", so it never downloads or runs MSW's 155 KB chunk.
- Soft delete: `DELETE` sets `deletedAt`; deleted users are hidden everywhere and `POST …/restore`
  brings them back (the Undo in the toast).

## 6. Components

- **Library (`components/common/`)**: Button, Input, Select, Modal, Card, Table (+ Pagination),
  Alert, Tabs – the brief's 8 – plus VirtualList, Checkbox, Skeleton/LoadingState, ErrorState and
  icons. Each of the 9 main components has stories and tests; Storybook has a light/dark toolbar.
- **Accessibility is built into the library**, so features get it for free: labelled inputs with
  errors linked by `aria-describedby`; Modal with focus trap, `inert` background and focus return;
  Tabs with roving tabindex and arrow keys; Table with `aria-sort`; Alert with `role="alert"` or
  `"status"`; VirtualList rows with `aria-setsize` / `aria-posinset`.
- **Native first:** the Select is a native `<select>` (single and multiple) – keyboard, screen
  reader and mobile pickers work without custom code. The Modal is hand-built rather than the
  native `<dialog>`, so the focus trap the brief asks for is explicit and testable.
- **Every data view has three states:** skeleton + screen-reader "Loading …", empty message, and
  error with "Try again". `?mock-fail=` makes the error states easy to see.

## 7. Forms

- One Zod schema per form (`userSchema` is the brief's, plus trimming and lower-casing the email);
  types come from `z.infer`, so rules and types cannot drift apart.
- React Hook Form with `zodResolver`; browser validation is off (`noValidate`) so messages are consistent.
- Focus moves to the first invalid field on submit (React Hook Form, via forwarded refs).
- Server errors that name a field (400/409) are put on that field with `setError`; other errors show
  as an alert in the dialog.
- Closing a changed form asks "Discard changes?" (Cancel, Escape and backdrop).

## 8. Styling and theming

- Tailwind CSS 4, mobile-first. The app layout uses `minmax(0, 1fr)` and `min-w-0` so wide content
  (tables, the chart) can never push the page wider than the screen.
- **Dark mode:** follows the OS until the user presses the toggle (`aria-pressed`). A tiny inline
  script in `index.html` sets the theme before the first paint, so there is no white flash.
- **Theme tokens** (`src/index.css`): in dark mode the neutral slate scale is reversed
  (slate-50 ↔ slate-950 …), so `text-slate-900` always means "strongest text"; named tokens
  (`bg-surface`, `text-accent`, `text-danger`, `text-success`, `ring-focus`) switch to lighter
  shades; coloured tints use explicit `dark:` classes. Contrast was verified with axe in both themes.
- System font stack: no web-font download.

## 9. Performance

Measured with Lighthouse on the production build (median of 3 runs per page, see
`docs/lighthouse/`). Final scores: **mobile 98 / 94 / 93** (login / dashboard / users),
**desktop 100** on all three.

| Step | Effect (mobile) |
|---|---|
| Route-level code splitting (`lazy()` + `Suspense` in `AppLayout`) | Dashboard, users, notifications and not-found are separate chunks |
| Start MSW on the first API request instead of on page load | `/login` 81 → 98 in single runs (Total Blocking Time 800 → 170 ms); stayed 92–99 in the final 3 runs |
| First render inside `startTransition` | React renders the first frame in slices instead of one long task |
| Replace Recharts with a hand-written SVG chart | `/dashboard` 86 → 96 in a 5-run comparison (TBT 560 → 220 ms); −109 KB gzipped |
| Reserve space for the result count and make skeleton rows as tall as real rows | `/users` CLS 0.07 → 0.008 |
| Virtual list for "All users" | 10,000 users render about 15 rows at a time |
| `memo` on list rows and row actions | Rows that did not change do not re-render while scrolling or refetching |

`memo`/`useMemo` are used only where rows repeat; elsewhere they would add complexity for no
measurable gain.

**Bundles (gzipped):** the login page needs about 111 KB of JavaScript (React, React DOM, router,
React Query, Zustand, React Hook Form, Zod). Page chunks: dashboard 3.5 KB, users 17.5 KB,
notifications 0.6 KB. MSW (155 KB) loads only when the first API request is made.

**Measuring honestly:** single mobile runs varied by up to ~10 points on the same build, so the
Lighthouse script runs each page several times and keeps the median; every score is in
`summary.json`. Signed-in pages are measured with a cleared HTTP cache, so all code is downloaded.

## 10. Testing

`npm test` runs **173 tests in 28 files**:

| Layer | What |
|---|---|
| Unit | stores, hooks (`useDebounce` with fake timers), utils, schemas, chart scale |
| Component | the library components: roles, keyboard, focus trap, axe |
| Integration | full pages through `<App />` against the MSW handlers: auth flow, CRUD, optimistic update + rollback, debounced search (one request), dashboard, notifications, route focus, dark mode, virtual list |
| Contract | the mock API itself (paging, sorting, filters, soft delete, errors) |

- TDD for the core logic: the failing tests were committed first in each part
  (`test: failing test for …`), then made to pass.
- Tests query by role and accessible name, so they also check accessibility.
- Real-browser checks that jsdom cannot do are scripts: `npm run a11y` (axe in both themes, reflow,
  keyboard, every story) and `npm run lighthouse`.

## 11. Trade-offs and alternatives

| Decision | Alternative | Why this one |
|---|---|---|
| Zustand | Redux Toolkit | Small client state; less boilerplate; server state is in React Query anyway |
| URL for list state | Component state | Reload, Back/Forward and shared links keep the view |
| Hand-written SVG chart | Recharts (first version) | Recharts cost ~10 mobile Lighthouse points; the data table already gives exact values |
| Native `<select>` | Custom listbox | Accessible on every device without custom code |
| Hand-built Modal | `<dialog>` | Explicit, testable focus trap (the brief asks for one); `inert` background |
| sessionStorage token | HttpOnly cookie | A cookie needs a real server. Trade-off: any script on the page (XSS) could read the token |
| MSW in production | Hard-coded data | Real fetch, loading and error behaviour; same handlers in tests and Storybook |
| Optimistic edit, server-confirmed create | Optimistic everything | A new row needs the server's id; an edit can be rolled back safely |
| One confirmation + Undo for delete | Double confirmation | Less friction, and mistakes can still be reversed |

## 12. Known limitations

- React Router v6 has an open-redirect advisory (fix only in v7, which the brief rules out);
  mitigated by `safeRedirect`.
- The token in sessionStorage is readable by scripts on the page (see trade-offs).
- The mock API lives in the browser: data is per browser, and there is no real security.
- Screen-reader testing is still to be done (checklist in `docs/accessibility.md`).
- The "All users" view uses the sort chosen in the table view; it has no sort control of its own.

# Month 4 Plan – AdminFlow Dashboard (Frontend Architecture)

## 1. Summary

Build **AdminFlow**, a single-page admin dashboard for a SaaS platform in React 18 + TypeScript.
It needs five working features: login/logout with protected routes, a dashboard with metric cards
and a trend chart, full user management (paginated/sortable/filterable list, create, edit with
optimistic updates, soft delete with confirmation), debounced search, and a notifications system.
The app must meet WCAG 2.1 AA, score 90+ on Lighthouse Performance, work mobile-first and show
proper loading and error states (dark mode is a bonus). Alongside the app we build a Storybook
library of 8+ reusable components and write an accessibility audit and an architecture document.
The brief gives no backend, so the app talks to a mock API.

## 2. Tech stack

Required by the brief (fixed):

| Concern | Choice | Note |
|---|---|---|
| Build tool | Vite | |
| UI | React **18** + TypeScript (strict) | Pin React 18 – `create vite` now installs 19 by default |
| Routing | React Router **v6** | Pin v6 – current npm `latest` is v7 |
| Server state | TanStack Query (React Query) | Caching, loading/error states, optimistic updates |
| Forms | React Hook Form + Zod (`@hookform/resolvers`) | |
| Component library | Storybook (React + Vite) | With `@storybook/addon-a11y` |

Open choices – proposed and **approved**:

| Concern | Proposal | Reason | |
|---|---|---|---|
| Client state | **Zustand** | The brief's own example is `useAuthStore()`; less boilerplate than RTK for 3 small stores (auth, notifications, UI/theme) | Approved |
| Styling | **Tailwind CSS** | No runtime CSS-in-JS cost (helps Lighthouse), built-in `dark:` variant for the bonus, mobile-first breakpoints by default | Approved |
| Mock backend | **MSW (Mock Service Worker)** with data kept in `localStorage` | The app uses real `fetch` calls, so React Query code is the same as with a real API; the same handlers serve tests (`msw/node`) and Storybook | Approved |
| Chart | **Recharts**, lazy-loaded with the dashboard | Accessible SVG output, small API; lazy-loading keeps it out of the first bundle | Approved |
| Virtual list | **@tanstack/react-virtual** | Headless, tiny, matches the brief's virtual-list example | Approved |
| Tests | **Vitest + React Testing Library + user-event + vitest-axe** | Vitest shares Vite's config; axe checks give automated a11y evidence per component/page | Approved |
| Lint/format | ESLint (typescript-eslint, react-hooks, jsx-a11y) + Prettier | `jsx-a11y` catches a11y mistakes at lint time | Approved |
| Lighthouse | Lighthouse **user-flow** script (Lighthouse + Puppeteer using installed Chrome) against `vite preview` | Can log in and audit the protected pages, not just `/login` | Approved |

Environment: Node 26 / npm 11 (as in Months 2–3). Exact versions are pinned when installed.

## 3. Submission checklist

Required files (participant name `subhash-jeewantha`), built into `submission/`:

- [ ] `subhash-jeewantha-month4-app.zip` – React project (source only: no `node_modules`, `dist`, `.env`)
- [ ] `subhash-jeewantha-month4-storybook.zip` – Storybook build (`storybook-static/`)
- [ ] `subhash-jeewantha-month4-lighthouse.pdf` – Lighthouse report
- [ ] `subhash-jeewantha-month4-accessibility.md` – A11y audit
- [ ] `subhash-jeewantha-month4-architecture.md` – Architecture decisions

Project structure from the brief:

- [x] `src/components/common/` – reusable components
- [x] `src/components/layout/` – layout components
- [x] `src/components/features/` – feature-specific components
- [x] `src/hooks/`, `src/stores/`, `src/pages/`, `src/utils/`, `src/types/`, `src/App.tsx`
- Additions (to be justified in the architecture doc): `src/schemas/` (the brief's own
  `schemas/userSchema.ts`), `src/api/` (fetch client + React Query hooks), `src/mocks/` (MSW).

Setup checklist from the brief:

- [x] Vite + React + TypeScript
- [x] Zustand or Redux Toolkit
- [x] React Router v6
- [x] React Query for server state
- [x] React Hook Form + Zod
- [x] Tailwind CSS or styled-components

Storybook – required components (each with stories for the listed variants):

- [x] Button (primary, secondary, danger variants)
- [x] Input (text, email, password, with error)
- [x] Select (single, multi-select)
- [x] Modal (with focus trap)
- [x] Card (with header, body, footer)
- [x] Table (sortable, with pagination)
- [x] Alert (info, success, warning, error)
- [x] Tabs (controlled)

## 4. Part-by-part plan

Rubric keys: **FC** Feature Completeness (25), **SM** State Management (20), **A11y** Accessibility (20),
**Perf** Performance (20), **CL** Component Library (10), **CQ** Code Quality (5).

The brief gives 2 h of part time inside a 4 h session plus offline work; Storybook has no time slot,
so each common component gets its story when it is built, and Part 4 completes the library.

### Part 1 – Application Setup (brief: 20 min)

- [x] Vite + React 18 + TypeScript (strict), React Router v6, TanStack Query, Zustand,
      React Hook Form + Zod, Tailwind – all pinned in `package.json` (CQ)
- [x] Brief's folder structure under `src/`, with path alias `@/` (CQ)
- [x] ESLint (typescript-eslint, react-hooks, jsx-a11y, storybook) + Prettier; scripts `lint`, `format`,
      `typecheck`, `test`, `build`, `preview`, `storybook`, `build-storybook` (CQ, A11y)
- [x] Vitest + RTL + axe-core set up (own 5-line `axeViolations` helper instead of the stale
      `vitest-axe`); smoke tests of the app shell (CQ)
- [x] MSW set up: `src/mocks/` handlers for the whole API + seeded data (250 users, 180 days of
      metrics, activity, notifications) persisted to `localStorage`, artificial latency, and
      `?mock-fail=` / `?mock-latency=` / `?mock-reset` to show error and loading states (FC)
- [x] Storybook initialised with the a11y addon and Tailwind; MSW addon for data stories (CL)
- [x] Layout shell: `AppLayout` with skip link, header, responsive sidebar/nav, `<main>` landmark (A11y)
- [x] README: setup, scripts, structure, mock API. No `.env` variable is needed yet.
- Version notes: TypeScript **6.0** (typescript-eslint does not support 7 yet), ESLint **9**
  (eslint-plugin-jsx-a11y does not support 10 yet), MSW **3** (`onUnhandledFrame` replaces
  `onUnhandledRequest`), Tailwind 4 via `@tailwindcss/vite` (no tailwind/postcss config files).
- Commit: `chore: set up Vite, React 18, TypeScript and tooling`

### Part 2 – Core Features (brief: 60 min)

- [x] **Auth** – `stores/authStore.ts` with the brief's `AuthState` (`user`, `token`, `isLoading`,
      `login`, `logout`) plus `error` and `expireSession`; session persisted to `sessionStorage`;
      `ProtectedRoute` redirects to `/login` and back to the original page (only safe in-app paths,
      `utils/safeRedirect.ts`); sign-out and a 401 both clear the React Query cache (FC, SM)
- [x] **Dashboard** – metric cards (users, revenue, orders, change vs. previous 30 days), lazy-loaded
      line chart with a data-table alternative and 7/30/90-day **Tabs**, recent activity, quick actions (FC, A11y)
- [x] **Users list** – server-side pagination, sorting, filtering (role, status) via React Query;
      page/sort/filters/search in the URL (reload, back button, shareable links) (FC, SM)
- [x] **Create user** – form in a modal; validation; success toast; list invalidated (FC)
- [x] **Update user** – pre-filled form; optimistic update across all cached pages, rollback on error (FC, SM)
- [x] **Delete user** – confirmation dialog (Cancel focused first); soft delete; "Undo" in the toast restores it (FC)
- [x] **Search** – `hooks/useDebounce.ts` (brief's hook, 300 ms) driving the users query; clear button,
      `role="status"` result count. No minimum length: the server handles any length cheaply, and a
      minimum would make short names like "Al" look unfindable (FC, A11y)
- [x] **Notifications** – `stores/notificationStore.ts` for toasts (auto-dismiss, paused on hover/focus,
      longer when there is an Undo button, `aria-live`) plus a notification centre: header bell with
      unread count in its name, panel, notifications page, mark-as-read (optimistic) / mark-all-read (FC, SM)
- [x] API client (`src/api/client.ts`): bearer token, `ApiError` with status + field errors, 401 → session
      expired, no retries on 4xx; only requests wait for MSW, the **first render does not** (FC, Perf)
- [x] Loading skeletons (+ screen-reader "Loading …"), empty states and error states with retry on every data view (FC)
- [x] All 8 brief components built with stories + tests: Button, Input, Select, **Modal** (focus trap),
      Card, Table (+ Pagination), Alert, **Tabs**; plus Checkbox, Skeleton, ErrorState, icons (CL)
- [x] Tests: auth store, `ProtectedRoute` + login flow, `useDebounce` (fake timers), safe redirect,
      users CRUD flows against MSW, optimistic update + rollback, dashboard, notifications, components (CQ)
- Moved here from Part 3, because the brief's Part 2 CRUD table already requires "Form validation":
  `userSchema` (the brief's schema), `loginSchema`, a basic `UserForm` and `LoginForm` with React Hook Form + Zod.
- Moved here from Part 4: **Modal** (needed by the delete confirmation) and **Tabs** (chart range).
- Bugs the tests caught: logout request sent without its token (store cleared it first); edit
  toasts lost because `mutate()` callbacks die with the unmounting dialog (now `mutateAsync`).
- Commits: `test: failing test for auth store, protected route and debounced search` (TDD red),
  then `feat: add auth, dashboard, user management, search and notifications`

### Part 3 – Forms & Validation (brief: 20 min)

- [x] `schemas/userSchema.ts` – the brief's schema, types inferred with `z.infer` (done in Part 2)
- [x] `schemas/loginSchema.ts` for the login form (done in Part 2)
- [x] `UserForm` with React Hook Form + `zodResolver`; reused for create and edit (done in Part 2)
- [x] `aria-invalid`, `aria-describedby` to hint and error, required fields marked (done in Part 2, in Input/Select/Checkbox)
- [ ] Focus moves to the first invalid field on submit – verify and test (A11y)
- [ ] Server field errors mapped onto the field (409 "email already exists" under Email, not only an alert) (FC)
- [ ] Unsaved-change guard: confirm before closing a dirty form (Cancel, Escape, backdrop) (FC)
- [ ] Edit form: Save disabled until something changed; trim/normalise email (lower-case) in the schema (FC)
- [ ] Tests: schema rules (unit), server error mapping, unsaved-change guard (CQ)
- Commit: `feat: add server-side field errors and unsaved-change guard to forms`

### Part 4 – Accessibility & Performance (brief: 20 min + offline)

- [x] Modal focus trap, `Escape` to close, focus returned to the trigger, `aria-labelledby` /
      `aria-describedby` as in the brief (A11y) (done in Part 2, tested in `Modal.test.tsx`)
- [ ] Icon buttons with `aria-label`, decorative icons `aria-hidden`, visible focus rings,
      colour contrast ≥ 4.5:1 in light and dark themes, reflow at 320 px, 200 % zoom (A11y)
- [ ] Code splitting with `lazy()` + `Suspense` per route; Recharts only in the dashboard chunk (Perf)
- [ ] `memo` / `useMemo` / `useCallback` where profiling shows re-renders – not by default (Perf)
- [ ] Virtualised user list for large datasets (e.g. a "show 10,000 users" stress mode) (Perf)
- [ ] Bundle check (`rollup-plugin-visualizer` or `vite build` report); fonts/images optimised (Perf)
- [ ] Route changes: update `document.title` and move focus to the page heading (A11y)
- [x] Remaining components + stories: **Tabs** (controlled) – Storybook now has all 8 (CL) (done in Part 2)
- [ ] Dark mode (bonus, included): system preference + toggle in the header, stored in the UI store (FC bonus)
- [ ] Automated a11y: axe-core (`src/test/axe.ts`) on every page + Storybook a11y addon with no violations (A11y)
- [ ] Manual a11y audit: keyboard-only walkthrough, NVDA screen reader, contrast, zoom/reflow;
      results in `docs/accessibility.md` (A11y)
- [ ] Lighthouse user-flow on the production build (`/login`, `/dashboard`, `/users`),
      mobile and desktop; report saved as PDF (Perf)
- [ ] `docs/architecture.md` – folder structure, state split (server state in React Query vs.
      client state in Zustand), routing/auth, mock API, styling, testing, trade-offs (SM, CQ)
- [ ] `scripts/package-submission` builds the 5 files into `submission/` (like Months 2–3)
- [ ] README: final setup/run/test steps, design decisions, known limitations, Challenge Coverage
- Commits: `feat: …` / `perf: …` for code, `docs: add accessibility audit and architecture`,
  `chore: add submission files`

## 5. Rubric map

| Criterion (points) | Evidence in the repo | Task(s) |
|---|---|---|
| Feature Completeness (25) | `src/pages/*`, `src/components/features/*`, `src/mocks/*`; feature tests in `src/**/*.test.tsx`; README "Challenge Coverage" | Part 2 (all features), Part 3 (forms), Part 4 (dark mode bonus) |
| State Management (20) | `src/stores/{authStore,notificationStore,uiStore}.ts`, `src/api/*` (React Query hooks, optimistic updates), URL state for the users list; "State" section of `docs/architecture.md`; store tests | Part 2 auth/users/notifications, Part 4 architecture doc |
| Accessibility (20) | `docs/accessibility.md` (axe + Lighthouse + manual keyboard/NVDA results); `eslint-plugin-jsx-a11y`; vitest-axe tests; Storybook a11y addon; Modal focus trap | Part 1 layout/lint, Part 3 form errors, Part 4 a11y tasks |
| Performance (20) | `submission/*-lighthouse.pdf`, `docs/lighthouse/*`, route-level `lazy()`, virtual list, bundle report | Part 4 performance tasks + Lighthouse run |
| Component Library (10) | `src/components/common/*.stories.tsx` (8 components, all listed variants), `submission/*-storybook.zip` | Parts 2–4 components + stories |
| Code Quality (5) | TypeScript strict, ESLint/Prettier clean, `npm test`, folder structure as in the brief, `docs/architecture.md` | All parts |

## 6. Risks and questions

**Decisions (approved 2026-11-08)**

1. **Stack:** Zustand, Tailwind, MSW, Recharts, TanStack Virtual, Vitest and the Lighthouse
   user-flow, as in section 2.
2. **Login credentials:** no password is stored anywhere. The mock API accepts any registered
   user's email with any password that passes the login schema (≥ 8 characters); the login page
   lists the demo emails. This keeps CLAUDE.md's "no passwords in tracked files" rule.
3. **Lighthouse target:** 90+ Performance on the **mobile** preset (slow 4G, CPU throttling) for
   `/login`, `/dashboard` and `/users`; desktop results included as well.
4. **Dark mode (bonus):** included. Every colour pair must pass contrast in both themes.

**Ambiguities I resolved myself (tell me if you disagree)**

- "Notifications system" is not defined: I plan **both** action toasts and a notification centre
  (bell + unread count + panel), so either reading of the brief is covered.
- "Soft delete" with no backend: the mock API sets `deletedAt` and hides the user; the toast offers Undo.
- "Quick actions" is not defined: shortcut buttons on the dashboard (add user, view users, notifications).
- The 8 Storybook components have no time slot; they are built during Parts 2–4 as the features need them.
- The brief's example `ProtectedRoute` has no loading state; mine also waits for the persisted
  session to load, so a page reload does not flash the login page.

**Risks**

- **Version drift:** React 19 and React Router v7 are the npm defaults now; installing without pins
  would silently break "React 18 / Router v6". All versions get pinned.
- **npm 11 install scripts:** npm 11 blocks dependency install scripts (seen in Months 2–3). esbuild
  and MSW may need `npm approve-builds` or a manual step; I will report what is blocked.
- **Lighthouse 90+ on mobile** with a chart and an MSW service worker in the production build:
  mitigated by route splitting, lazy chart, no web fonts (system font stack), and measuring early.
- **Lighthouse on protected pages** needs a scripted login (user-flow); Puppeteer must use the
  installed Chrome (`PUPPETEER_SKIP_DOWNLOAD`, as with mermaid-cli in Month 3).
- **Manual a11y testing** with NVDA needs you or me to actually run it; automated tools catch only
  part of WCAG, so the audit will say clearly what was tested by hand and what was not.
- **Time:** the in-session budget (2 h of parts) is tight for this scope; the plan front-loads the
  rubric's heavy items (features 25, state 20) and leaves polish for offline work.

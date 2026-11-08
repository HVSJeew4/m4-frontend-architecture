# AdminFlow – Accessibility Audit

**Target:** WCAG 2.1 level AA · **Audited:** 8 November 2026 · **Build:** production (`vite build`)

## 1. Summary

| Check | Scope | Result |
|---|---|---|
| axe-core in a real browser (WCAG 2.0/2.1 A + AA rules) | 8 views (6 pages + 2 dialogs) × light/dark × phone/desktop = **32 runs** | **0 violations** |
| axe-core on every Storybook story | 33 stories × light/dark = **66 runs** | **0 violations** |
| Reflow at 320 px (1.4.10) and 200 % zoom (1.4.4, 640 px viewport) | 7 pages × 2 widths = **14 checks** | **No horizontal scrolling** |
| Keyboard walk: focus order + visible focus (2.4.3, 2.4.7) | Login, Dashboard, Users × light/dark = **6 walks** | **Every stop has a visible focus indicator** |
| Lighthouse accessibility category | /login, /dashboard, /users × mobile/desktop | **100** on all six |
| Unit/integration tests with axe (jsdom) | Every page, dialog and library component | **0 violations** (in `npm test`) |
| ESLint `jsx-a11y` (strict) | All source files | Clean (2 justified exceptions, see §5) |
| Screen reader (NVDA) | – | **Not yet tested – see §6** |

Automated tools find only part of WCAG problems, so section 4 also lists how each relevant
success criterion is met in the code, and section 6 lists what still needs a person.

## 2. How it was tested

| Method | Tool | How to repeat |
|---|---|---|
| Automated, real browser | axe-core 4.14 injected into Chrome via Puppeteer; light and dark theme; 375 px and 1280 px | `npm run build && npm run build-storybook && npm run a11y` → `docs/a11y/axe-results.json` |
| Layout | `scrollWidth` vs viewport at 320 px and 640 px | same script |
| Keyboard | 14 × Tab per page, recording the focused element and its computed outline / box-shadow | same script |
| Components | Every story in Storybook's iframe with the theme toolbar global set | same script; or `npm run storybook` → Accessibility panel |
| In the test suite | `axeViolations()` (`src/test/axe.ts`) in page and component tests; contrast is skipped there because jsdom has no CSS | `npm test` |
| Lighthouse | Lighthouse 13 accessibility category | `npm run lighthouse` |
| Visual review | Screenshots of every page in both themes and at phone width | – |

## 3. Results per view

All 32 axe runs passed. Rules that passed per run (minimum over the 4 runs of each view; the
number depends on what is on the page):

| View | Rules passed | Violations |
|---|---|---|
| Login | 21 | 0 |
| Dashboard | 28 | 0 |
| Users – paged table | 31 | 0 |
| Users – "All users" virtual list | 31 | 0 |
| Add user dialog | 24 | 0 |
| Delete user dialog | 20 | 0 |
| Notifications | 21 | 0 |
| Not found | 20 | 0 |

Recorded Tab order (light theme, desktop):

- **Login:** Dark mode → Email → Password → Sign in → (leaves the page) → wraps to Dark mode
- **Dashboard:** Skip to main content → AdminFlow → Dark mode → Notifications, 3 unread → Sign out →
  Dashboard → Users → Notifications → 30 days (tab) → chart panel → Show the chart data as a table →
  Add a user → Find a user → View notifications
- **Users:** Skip to main content → AdminFlow → Dark mode → Notifications, 3 unread → Sign out →
  Dashboard → Users → Notifications → Add user → Search → Role → Status → Pages (tab) → table region

The order follows the visual order (header, navigation, then the page from top to bottom).

## 4. WCAG 2.1 AA – how each relevant criterion is met

| Criterion | How | Where |
|---|---|---|
| 1.1.1 Non-text content | Icons are `aria-hidden`; icon-only buttons have `aria-label` ("Delete user Eden Editor"); the chart is `role="img"` with a text summary, plus a data table | `icons.tsx`, `UserRowParts.tsx`, `TrendChart.tsx`, `TrendCard.tsx` |
| 1.3.1 Info and relationships | Landmarks (`header`, `nav`, `main`), one `h1` per page, real `<table>` with `scope`, `<label for>`, lists for cards/activity, every form control with its own `<label>` | layout, `Table.tsx`, form controls |
| 1.3.2 Meaningful sequence | DOM order = visual order; dialogs are portalled but focus moves into them | `Modal.tsx` |
| 1.4.1 Use of colour | Status badges say "Active/Inactive"; metric change has an arrow, a sign and "Up/Down" text; chart lines differ by dash pattern; unread notifications have hidden "Unread:" text; selected tab has a pill shape in both themes | `UserRowParts.tsx`, `MetricCards.tsx`, `TrendChart.tsx`, `Tabs.tsx` |
| 1.4.3 Contrast (minimum) | All text ≥ 4.5:1 in both themes, verified by axe in the real browser | `index.css` tokens |
| 1.4.4 Resize text / 1.4.10 Reflow | No horizontal scroll at 320 px or at 200 % zoom; wide tables scroll inside their own keyboard-focusable region (allowed for data tables) | `AppLayout.tsx` (`minmax(0,1fr)`), `Table.tsx` |
| 1.4.11 Non-text contrast | Focus rings and chart lines ≥ 3:1; focus ring colour is lighter in dark mode | `--color-focus`, chart palettes |
| 1.4.13 Content on hover or focus | Notification panel: opened by click, closes on Escape or outside click | `NotificationBell.tsx` |
| 2.1.1 Keyboard | Everything works by keyboard: tabs (arrows/Home/End), dialogs, menu, table sorting, virtual list region | tests in `Tabs.test.tsx`, `Modal.test.tsx` |
| 2.1.2 No keyboard trap | The modal focus trap is intentional and always escapable (Escape, Cancel, Close) | `Modal.tsx` |
| 2.2.1 Timing adjustable | Toasts pause while hovered or focused; toasts with Undo stay 10 s | `Toaster.tsx`, `notificationStore.ts` |
| 2.4.1 Bypass blocks | "Skip to main content" link is the first Tab stop | `SkipLink.tsx` |
| 2.4.2 Page titled | Every route sets `document.title` ("Users · AdminFlow") | `PageHeading.tsx` |
| 2.4.3 Focus order | Focus moves into dialogs and back to the trigger; after navigation focus moves to the new `h1`; after a delete it moves to the page heading (the row is gone) | `Modal.tsx`, `PageHeading.tsx`, `DeleteUserDialog.tsx` |
| 2.4.6 Headings and labels | Descriptive headings and labels; every input has a visible label | – |
| 2.4.7 Focus visible | Visible focus ring on every control, verified by the keyboard walk | `focus-visible:ring-*` |
| 2.5.3 Label in name | Visible text is part of the accessible name ("Next" → "Next page") | `Pagination.tsx` |
| 3.1.1 Language of page | `<html lang="en">` | `index.html` |
| 3.2.2 On input | Changing a filter updates the list in place; no context change, focus stays put | `UserFilters.tsx` |
| 3.3.1 Error identification / 3.3.3 Error suggestion | Field errors in text ("Name must be at least 2 characters"), `aria-invalid`, linked with `aria-describedby`; server errors (409) on the field | `Input.tsx`, `UserForm.tsx` |
| 3.3.2 Labels or instructions | Labels, required marker (visual `*` + `required` attribute), hints ("Inactive users cannot sign in") | form controls |
| 3.3.4 Error prevention | Delete asks for confirmation and offers Undo; closing a changed form asks "Discard changes?" | `DeleteUserDialog.tsx`, `UserFormModal.tsx` |
| 4.1.2 Name, role, value | Native elements first; ARIA where needed: `aria-expanded`/`aria-controls` (menu, bell), `aria-pressed` (dark mode), `aria-selected` (tabs), `aria-sort` (table), `aria-modal` (dialogs) | – |
| 4.1.3 Status messages | Result count, toasts and loading text are live regions (`role="status"`, `aria-live`); errors use `role="alert"` | `UsersPage.tsx`, `Toaster.tsx`, `Skeleton.tsx` |

Extra (WCAG 2.2, not required for 2.1 AA): touch targets are at least 44 × 44 px on interactive
controls in the header and forms.

## 5. Issues found and fixed during the audit

| Found by | Issue | Fix |
|---|---|---|
| Reflow check | At 320 px the header was 2 px wider than the screen | Tighter header padding/gaps below `sm` |
| Reflow check | Menu button was 40 px wide (below the 44 px target) | `h-11 w-11` |
| Reflow check | The new SVG chart and the dashboard grid locked each other at 640 px wide (grid items do not shrink below their content) | `min-w-0` on grid items, `viewBox` + `max-w-full` on the SVG |
| Keyboard walk | After a reload, focus jumped to the page heading (skipping header and navigation) | Only move focus for history entries other than the one the app loaded on |
| Visual review | In dark mode the selected tab differed only by text colour | Darker tab bar, lighter selected pill |
| Tests | "Next page" was announced as "Nextpage" (space lost inside a visually hidden span) | Space moved outside the span |
| Review | `aria-current="page"` on plain text in the pagination | Removed (it belongs on links) |
| Review | A `<p>` inside a `<ul>` (loading text in the metric cards) | Moved outside the list |

Justified ESLint `jsx-a11y` exceptions (each commented in the code):

- `Modal.tsx`: key handler on the `role="dialog"` element – the WAI-ARIA dialog pattern handles
  Escape and Tab on the dialog itself.
- `Toaster.tsx`: hover/focus handlers on a toast – they only pause the auto-dismiss timer; there is
  no action to make keyboard-operable.

## 6. Not yet tested: screen reader (NVDA)

I could not run a screen reader in this environment, so these results are **not** claimed. Please
test with NVDA + Chrome or Firefox on Windows (`Insert` = NVDA key) and fill in the last column.

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Open `/login`, press `H` | "Sign in to AdminFlow, heading level 1" | ☐ |
| 2 | Submit an empty form | Focus on Email; "invalid entry", the error message is read | ☐ |
| 3 | Sign in as `user@adminflow.test` | The alert "This account does not have admin access" is read without moving focus | ☐ |
| 4 | Sign in as admin, press `D` (landmarks) | Header, navigation "Primary", main | ☐ |
| 5 | Tab to the bell | "Notifications, 3 unread, button, collapsed" | ☐ |
| 6 | Users: type "eden" in search | "1 user found" is announced once typing stops | ☐ |
| 7 | Sort by Name | "Name, sorted ascending" on the column header | ☐ |
| 8 | Delete a user | "Delete user?, dialog", description read, focus on Cancel; Escape returns to the button | ☐ |
| 9 | Confirm delete | "User deleted" toast is announced; Undo is reachable by Tab | ☐ |
| 10 | Dashboard: Tab to the time-range tabs, use ← → | "7 days, tab, selected, 1 of 3" | ☐ |
| 11 | Dashboard chart | The chart's summary is read; the data table can be opened and read by cells | ☐ |
| 12 | Users → "All users" | Rows read as "item 1 of 250" while scrolling with the arrow keys | ☐ |
| 13 | Navigate Dashboard → Users with the nav link | Page title and "Users, heading level 1" are read | ☐ |
| 14 | Dark mode button | "Dark mode, toggle button, not pressed" → "pressed" | ☐ |

## 7. Known limitations

- Screen-reader behaviour (section 6) is untested until the checklist is done.
- No testing with Windows High Contrast / forced colours, or with voice control.
- The dashboard chart has no per-point keyboard tooltip; the data table is the accessible way to
  read exact values.
- The virtual list renders only visible rows, so browser "find in page" (Ctrl+F) cannot find users
  that are scrolled out of view; the search box covers this.

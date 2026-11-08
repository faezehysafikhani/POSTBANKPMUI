# Backend integration (branch `feature/backend-integration`)

The UI is being connected to the NexusCore backend (`PostBank.Api`) one area at a time. The rule: **the UI holds no business
logic** - it renders, collects input and calls the API; every decision (validation, calculation, permission, approval) is the backend's.
Plan and the list of backend additions: `docs/ui-integration/PLAN.md` in the backend repository.

## Running it

1. Backend: run the SQL scripts from `docs/upgrade` of the backend repository, then start `PostBank.Api` (NOT `NexusCore.Api`: that host does not register the project-management modules) (default `http://localhost:5251`).
2. UI: `npm install`, copy `.env.example` to `.env.local`, set `BACKEND_URL` if the backend is elsewhere, `npm run dev` (http://localhost:3000).
   `server.ts` forwards every `/api` request that is not an AI route to the backend, so the browser never talks to it directly (no CORS).
3. Sign in with the backend's administrator account (a username - the national code - and password; after a failed attempt a CAPTCHA is asked for).

## Where the connection lives

* `services/api.ts` - the only HTTP door: token handling, refresh on 401, the backend's error messages.
* `services/backend/*.ts` - one typed file per backend area (`auth`, `directory`: users, roles, organisation chart, calendars).
* `services/backend/mappers.ts` - shape adapters only (backend records -> the objects the screens use). No rules.
* `directory/AuthContext.tsx`, `directory/DirectoryContext.tsx` - the session and the directory data; every change goes to the backend and the lists are read back.
* `directory/ProjectsContext.tsx` - the projects the signed-in user may see (the backend decides which: `GET /api/portfolio/projects`), and create / update / status / submit / delete.
  The backend owns a project's charter, people, unit, calendar, dates, status, team and approval state, and (phase 3) its registers: risks, stakeholders, status reports,
  delay reasons and documents, with the risk matrix settings and the stakeholder strategy wording. The remaining parts a screen keeps inside the project object
  (tab settings, visibility switches, actions ...) are **not connected yet**: they are kept in this browser per project id (`pms_project_extras`) until their own phase.
* `services/backend/registers.ts`, `registerMappers.ts`, `registerLoad.ts` - the register endpoints, their shape adapters and the batch loader
  (one call per register for all visible projects, plus the Workflow lookup that gives each item its approval state / next approver / decision history).
  Approving or rejecting a register item is `POST /api/workflow/approval-center/{id}/approve|reject` (`ProjectsContext.decide`); nothing about stages is computed in the browser.
* Two small pieces are still kept in the browser, keyed by item id (`pms_register_local`): the second approval round on a risk's response (risk response verification,
  connected with the task centre in a later phase) and the AI summary notes of a document.
* The status report's planned / actual progress are the project's backend figures (`progressFigures`, from `POST /projects/progress`).
* **Planning (phase 4)** - `services/backend/planning.ts` (waterfall + agile + progress endpoints), `planningMappers.ts` (shape adapters),
  `planningLoad.ts` (batch loader: plans, tasks, sprints, progress reports / status requests with their Workflow history, project progress figures) and
  `directory/planningOps.ts` (every write; each write is followed by reading the plan back). The browser no longer works out dates, weights, WBS codes,
  float, planned / actual percentages or approval states: the schedule tab shows what `GET /waterfall/schedule/plan` returns and sends edits
  (debounced, 600 ms) as activity updates / `PUT /dependencies/predecessor` / `PUT /activities/{id}/actual-progress`.
  Progress reports and agile status requests go to `/waterfall/progress-submissions` and `/agile/status-submissions` and are decided in the Workflow
  approval centre (approving with another figure = `confirmed-progress`). Settings (weighting / planned-progress mode), saved copies (baseline / progress
  information, which also feed the S-curve), MS Project import / export and the number of sprints are backend calls too.
  `utils.ts` keeps only presentation helpers: its old CPM / weighting / progress calculation was removed. Agile charts (burn-up / down) are still
  aggregated in the browser from the tasks until the reports phase (8).
* **Actions, strategy, knowledge, contracts (phases 5 and 6)** - `services/backend/actions.ts`, `actionMappers.ts` and `directory/ActionsContext.tsx` (actions, their
  status requests and approvals; the old local approver chain and the browser-side occurrence generator are gone), `strategy.ts` and `directory/StrategyContext.tsx`
  (strategy tree, alignment levels and percentages, knowledge library with real upload / download), `contracts.ts`, `contractMappers.ts`, `contractLoad.ts` and
  `directory/contractOps.ts` (contracts with addenda, invoices; amounts and totals come from the backend, approvals from Workflow). Risk-response verification
  (`riskResponses` in `registers.ts`) replaced the browser's second approval round: the report and its approval are the backend's.
  Where the UI had something the backend lacked it was added there (see the backend log): action source link / approvers / recurrence pattern / status requests,
  risk-response reports, strategy tree save with the total-100 rule, alignment scores, contract parties, addendum period, invoice title and period.
* `services/backend/errors.ts` - the words (Persian / English) for the backend's project error codes. The rules themselves live in the backend.
* `services/backend/runtimeDirectory.ts` - hands the backend-fed unit tree and calendars to plain helper functions that cannot use React context.
* Ids are strings (the backend's GUIDs).

## Status per area

| Area | State |
|---|---|
| Sign-in, session, CAPTCHA | **connected** |
| Users, roles, placement in the organisation chart | **connected** |
| Organisation chart (reference tables page) | **connected** |
| Work calendars (+ official holidays, work hours) | **connected** |
| Projects: list, create, edit charter, team, work status, send for approval, delete (guarded), portfolio visibility | **connected** (phase 2) |
| Risks (+ response status, matrix colours, level definitions), stakeholders (+ strategy wording), status reports, delay reasons, documents (real upload / download), their approval via the Workflow backend | **connected** (phase 3) |
| Project statuses list (reference tables page) | the backend's fixed set, shown read-only (a custom status could not be saved) |
| Schedule (WBS, dependencies, weights, float, planned / actual progress), weighting settings, saved copies, S-curve, MS Project import / export, agile tasks and sprint count, activity progress reports and task status requests (approved through the Workflow backend), project progress figures | **connected** (phase 4) |
| Actions (+ recurrence pattern, status requests with approval), risk-response verification, strategies, alignment matrix, knowledge library, contracts, addenda, invoices | **connected** (phases 5-6) |
| Approval chains (organisation-wide and per project), approval centre (projects, register items, reports, contracts, status requests; waiting-for-me comes from the backend's inbox), delegation of work, visibility switches, "confirmed progress on rejection" switch, per-project visible sections and contract / invoice access settings | **connected** (phase 7): `directory/GovernanceContext.tsx`, `services/backend/governance.ts` |
| Reports (units' performance and status matrix, project-manager evaluation) and the agile burn-up / burn-down chart | **connected** (phase 8): `services/backend/reports.ts`, `directory/useSprintChart.ts`. Needs the `Reporting.ViewAll` permission (admin has it; grant it to other roles on the backend) |
| Mock data | removed (phase 9): `data.ts` is deleted; no screen reads sample data |

A project (or any item) is approved at once when the backend has no approval chain for it: use "apply the standard chains" on the settings page (it calls `POST /api/integrations/project-workflow/settings/apply-defaults`) to create them.
Phase 7 notes: who may decide a step is enforced by the backend; the browser no longer resolves approvers or stages (`resolveWorkflowApproverId`, the default chains and `isActionVisibleToUser` are gone; the action list is already filtered by the backend's visibility rules).
Handing an item to someone else: the backend records the hand-over and ends chains (`/api/project-management/delegations`); the screen then sets the item's assignee itself (the delegation module does not own the item).
Stored but not enforced by the backend: the per-project contract / invoice access matrices. Not offered: a project chain with no step ("no approval for this project") - the backend supports it, the editor still requires one stage.
Phase 8-9 notes: the reports' figures (planned / actual progress, delayed count, rating, organisation total) and the sprint chart's cumulative series are computed by the backend; the browser only draws them. The portfolio dashboard's small count tiles remain presentation over the project list the backend already sent. Leftover local storage: `pms_register_local` (AI notes only - the AI features are not part of this work).
The AI features are not part of this work and are unchanged.

## Following the newest Core (sessions and the organization structure)

The backend (Core branch `feature/pm-core-gap-phase0`, which now carries the newest shared-platform changes) works differently in two places; the UI follows it and still holds no business logic. Everything here talks to the project-management and platform endpoints only - not to the task-management module (`/api/tasks`, task reports, repetitive tasks), which this UI does not use.

* **Sign-in sessions.** The refresh token is now an HttpOnly cookie (`nexus_rt`, path `/api/identity/auth`); the body never carries it and the page never sees it. `services/api.ts` sends `X-Nexus-Session: cookie` and `X-Requested-With` on the auth calls and keeps only the short-lived (15 min) access token; a refused token is renewed through the cookie and the request is retried once (also on reload, through `loadSession`). `server.ts` forwards the cookie, those headers, the browser's user agent and the client address, and passes back `Set-Cookie`, `X-Nexus-Session-Reason`, `Retry-After`. In production the BFF must be served over HTTPS (the cookie is `Secure` outside Development).
* **Session limit and idle timeout.** A sign-in that reaches the limit of open sessions shows the backend's list and lets the user close some (or the oldest) and finish with `POST /auth/login/complete` (`components/SessionComponents.tsx`). While signed in, `SessionWatcher` asks the backend how long the idle time has left (`GET /auth/sessions/current`, which is not activity) and warns before it ends; "stay signed in" is `POST /auth/sessions/current/activity`. When a session ends the sign-in page says why (the backend's `X-Nexus-Session-Reason`). A 429 (rate limit) is shown as "too many requests".
* **Units in the chart.** The organization structure owns a unit's place and code. A top-level unit is still created with `POST /api/organization/units`; a sub-unit is created with `POST /api/org-structure/nodes` (needs `org_structure.node.create`) and moved with `POST /api/org-structure/nodes/{id}/move` (`org_structure.node.move`). Renaming uses `PUT /api/organization/units/{id}` with the name, manager and state only; a different parent or code sent there is refused by the backend. Moving a unit to the top level is not offered in this screen (it needs a company).
* Seeded roles do not receive permissions added later: grant `org_structure.node.create`, `org_structure.node.move` and the session permissions to the roles that use these screens.


## Settings and profile (TMPB reference screens)

«تنظیمات و پروفایل» (`pages/SettingsProfilePage.tsx`) shows the TMPB reference screens from `tmpb/` (taken from `TMPBUI`,
branch `feature/1405-08-07-orgNode`): profile, work team, appearance, help, SMS panel, user management and the organization
structure. They use their own API client (`tmpb/services/nexusApi.ts`); it adopts the session the product already opened
(`components/TmpbSettings.tsx`, `adoptExternalSession`) and renews it from the same HttpOnly cookie. The reference stylesheet (`tmpb/reference.css`) is compiled by the Tailwind CLI from `vite.config.ts` on every start and build (no separate step, so the generated `tmpb/generated.css` can never be stale) and mounted only while these screens are open.
Administrators also get «تنظیمات مدیریت پروژه» with four sub-tabs (workflow and approvals, visibility, work calendars, base tables;
`components/ProjectSettingsTabs.tsx`). The old «مدیریت کاربران» and «تنظیمات» pages and menu items are gone; their routes lead here.

Look: the reference screens carry no look of their own. `tmpb/reference.css` maps their colour names to the product's palette (green accent,
green-grey neutrals), uses flat soft shadows and Vazirmatn, and is scoped to `.tw-scope` (no global reset, so the header, menu and
other pages are untouched; dialogs are drawn into `portalRoot()` for the same reason). The tab bars (`SegmentedTabs`, `PillTabs`) use the
product's `sp-tab` classes, and the page heading and workspace use `sp-heading` / `sp-workspace` from `pages/settings-profile.css`.
The product is light-only, so the reference's day/night, colour-palette and background-pattern choices are not offered; the
«ظاهر سامانه» tab keeps only the system name, logo and upload-size cards (administrators).

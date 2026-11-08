# Settings and organization structure from TMPB

Reference: `faezehysafikhani/TMPBUI`, branch `feature/1405-08-07-orgNode`, commit
`01af16e72824aa61889d5fa61cc95efaef06ba96`.
Core contracts reviewed: `nexuscore-taskmanagement`, same branch, commit
`9f74c04aec1f43971369f2ee888c98d9d4af23df`.

`tmpb/` contains the reference SettingsView, SystemAdministration, organization chart and editors,
API client, permission checks, sign-in/recovery/session-limit screens, and their dependencies.
The chart components and organization service are copied unchanged. No alternate organization model
or rules were introduced. Demo chart fixtures are used only by the regression scripts, never by the
production settings screen.

Product integration differences:

- Product defaults use PM's existing name/logo. PM's existing handbook fills the help tab; TM tutorial
  videos and task-management documentation are not bundled into the PM product.
- The existing PM workflow/calendar/reference settings remain under the expandable project settings
  section. Their data continues to use PM's existing persistence.
- The real TMPB sign-in replaces the demo password comparison. Settings use the server identity GUID
  and server-granted permissions. Existing project relationships retain numeric local IDs; `backendId`
  links them to the authenticated identity. A legacy account can be matched by username once, then the
  GUID is used. The old PM project/user lists are not migrated to the backend by this change.
- Existing browser snapshots cannot authenticate on their own. Server session refresh and the original
  session-ended event are used; no fallback to demo passwords is provided.
- The reference Tailwind stylesheet is compiled independently, then mounted only for reference screens,
  preserving PM's other page styles. Fonts are bundled through Vite so their URLs remain valid.

## Configure and run

`npm ci`, then `npm run dev`. `predev`/`prebuild` compile the reference stylesheet.
Configure `public/config/runtime-config.json` at deployment with the actual API origin, tenant slug and
request timeout. Empty origin means same-origin (reverse-proxy `/api` to PostBank.Api except the existing
PM AI routes). For development, `VITE_DEV_API_BASE_URL` can point to the API, with its CORS origin configured.
Use actual server credentials; `admin/admin` is no longer a demo login.

Deploy together with the API host change that installs/registers `Nexus.OrgStructure`. Build a fresh Core
package release from the reviewed branch and update the host's version/feed. Grant existing roles the
necessary org permissions. The reference intentionally hides unsupported/unpermitted tools; it does not
replace server authorization with the PM demo role.

## Validation

- `npm run lint`
- `npm run build`
- `npm run check:org-rules`
- `npm run check:org-tidy`
- `npm run check:org-mocks`

Live server login, permission enforcement, persistence, session revocation and SQL migrations require a
running PostBank API/database and the matching package feed. They are not verified by the fixture tests.

Visual browser verification is pending: Chromium is not installed in the workspace and its download
was unavailable. TypeScript, the production build, and all three organization regression scripts passed.
The 47 organization component/helper files and orgStructureApi.ts match the reference byte-for-byte.

## Update: synced with the reference, project settings as a tab

- Synced with `TMPBUI` `feature/1405-08-07-orgNode` (head `7c96832`): `SystemAdministration`, `PositionPermissionsDialog`,
  `OrgNodeCard`, `nexusApi` (the active-post header) and `utils/activePost.ts` (without its task-report part, which PM does not use).
  Only `SettingsView` (the `projectHelp` / `projectSettings` props) and `branding` (PM name and logo) differ from the reference now.
- The settings page has a main tab «تنظیمات مدیریت پروژه» (admins) with four sub-tabs: گردش کار و تاییدات, سطح مشاهده,
  تقویم کاری, جداول پایه (`components/ProjectSettingsTabs.tsx`). They reuse the existing PM pages and their data.
- The menu group «کاربران و تنظیمات» now has one item, «تنظیمات»; the old «مدیریت کاربران» page and route are removed
  (users, roles, titles, sign-in history, LDAP and SSO are in the settings page's «مدیریت کاربران» tab).
- UI only: the PM data (workflow, calendars, base tables) is still the browser-kept data of this branch.

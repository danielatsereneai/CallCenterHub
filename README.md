# Life@Perch Operations Hub

Life@Perch is a no-build static operations dashboard for Perch teams. It includes PocketBase-backed login and tasks, org-scoped task boards, static dashboard panels, team operations dashboards, Microsoft 365 quick links, a Knowledge area for feedback documents and AI prompts, feedback submission workflows, and an Ollama-compatible agent chat panel.

This repository can be used as a GitHub template and deployed to Cloudflare Pages. The current checkout is already configured for the Perch services in `modules/config.js`.

## Current Stats Overview

- App type: static HTML, CSS, and ES modules with no build step.
- Total project size reviewed: about 8,179 lines across app files, modules, and docs.
- Main app files: `index.html` (665 lines), `styles.css` (3,314 lines), `script.js` (410 lines).
- JavaScript modules: 9 modules across auth, chat, config, feedback, PocketBase, prompt storage, tasks, UI, and utilities.
- Documentation files: `README.md`, `docs/onboarding.md`, `docs/pocketbase-schema.md`, and `docs/perch-customer-setup-plan.md`.
- Current integrations: PocketBase at `https://pocketbase.sereneai.co.uk` and Ollama-compatible gateway at `https://api.sereneai.co.uk`.
- Current collections: `base_start_users` for auth and `base_start_tasks` for task records.
- Team dashboards currently configured: QC - Quality Control and Correspondence Team.
- Task statuses currently supported: New, To Do, Blocked, Hold, Completed.
- User access fields: `User Type` controls prompt editing and `org_id` controls task board/task visibility.
- Local persistence: pinned team navigation and customised AI prompts use `localStorage`; extra PocketBase token storage, where present, uses `sessionStorage`.

## What Is Included

- Static HTML, CSS, and JavaScript modules with no build step.
- PocketBase user login through the `base_start_users` auth collection.
- PocketBase task create, update, comments, and Kanban status handling through the `base_start_tasks` collection.
- User-role handling from the `base_start_users` record:
  - `User Type = Admin` can edit AI prompts and see all task boards.
  - `User Type = User` can view/copy prompts but cannot edit them.
  - `org_id` scopes visible task boards and tasks to Perch, ACI, TML, Connect, or Verify.
- Static dashboard layout with Quick Actions at the top, Quick Links below on the left, and PocketBase Tasks on the right.
- Operations page with team dashboard tiles and local pinned-team navigation.
- Team dashboards for QC - Quality Control and Correspondence Team.
- QC Feedback Submissions tool that rewrites raw feedback with the Ollama-compatible AI, allows review/edit before save, and saves feedback as a normal PocketBase task.
- Correspondence Team AI Email Response tool for drafting customer replies from customer emails and internal findings.
- Agent chat through an Ollama-compatible `/api/chat` endpoint, with current-session chat memory capped at 20 messages.
- Knowledge page with Feedback and Prompts tabs:
  - Feedback shows saved feedback submissions as minimised, PDF-style readable documents.
  - Prompts shows minimisable AI prompt cards for agent chat, task drafting, email response, and feedback coaching.
  - Admin users can edit/reset prompts; all users can view and copy prompts.
- Client-editable service and area configuration in `modules/config.js`.
- Onboarding docs for GitHub template use, PocketBase, Ollama gateway setup, and Cloudflare Pages.

## Current Review Notes

The app is in a strong static-dashboard shape: the code is split into sensible modules, syntax checks pass, and the README now lines up with the current Perch configuration and access model.

Quick possibilities:

- Wire the sidebar **Systems** item to a real page, or remove it until the page exists.
- Move team dashboard definitions and quick links into `modules/config.js` so non-developers can adjust them without editing UI code.
- Add a small smoke-test checklist or Playwright test for login screen render, nav switching, modal open/close, prompt copy, and Kanban rendering.
- Add a visible refresh control to the dashboard task panel if users need manual task reload from the first screen; the current refresh button exists on the Tasks board.
- Add a clear "assigned to me" label to the dashboard task panel, because the dashboard filters to visible tasks assigned to the logged-in user while the Kanban can show all visible tasks for the user's org.

Issues or mismatches to watch:

- The sidebar shows **Systems**, but it has no `data-view` and no active page behind it.
- Prompt edits are stored in browser `localStorage`, not PocketBase, so custom prompts are browser-local rather than shared globally.
- Standard users request only their org board's task records, and the browser keeps the same org filter as a defensive UI check. PocketBase collection rules should still enforce org-level access server-side before production use.
- The settings modal still says "Command Center User" and fallback names use "Command User"; the rest of the app is branded Life@Perch.
- The attachment field is named `attatchemnt`. This matches the documented PocketBase schema and current code, but it is intentionally misspelled and should only be renamed with a coordinated schema/code update.
- Local port `4177` may already be in use. Use another static-server port if needed.

## Current Dashboard Areas

- Dashboard: working Quick Actions, Quick Links, and assigned-to-me PocketBase Tasks panels. Standard users request only their org board's PocketBase tasks, and dashboard results are filtered to tasks assigned to the logged-in user.
- Operations: team dashboard tiles for QC and Correspondence, with pin/unpin controls that save locally in the browser.
- Team Dashboard: team-specific Quick Actions and Quick Links. QC includes Feedback Submissions. Correspondence includes AI Email Response.
- Tasks: Kanban-style task board backed by PocketBase, with org-scoped board filtering and drag/drop status updates.
- Knowledge: Feedback and Prompts tabs. Feedback documents and prompt cards open minimised and can be expanded.

Pinned team navigation is stored in browser `localStorage` under `lifeAtPerchPinnedTeamDashboards`, so it is personal to the browser and does not affect other users.

Custom prompt edits are stored in browser `localStorage` under `lifeAtPerchCustomPrompts`, so they are also personal to the browser and do not automatically sync across users or devices.

## User Access Model

Life@Perch expects the `base_start_users` record to include these additional fields when access control is needed:

- `User Type`: use `Admin` for administrators and `User` for standard users.
- `org_id`: use `Perch`, `ACI`, `TML`, `Connect`, or `Verify`.

Current behaviour:

- Admin users can edit/reset prompts in Knowledge and see all task boards.
- Standard users can view/copy prompts, but prompt editors are read-only and Save/Reset controls are hidden.
- Standard users only see tasks and task board choices for their `org_id`.
- `org_id = Perch` maps to the existing `PerchGroup` task board label.

## AI Tools

- Agent Chat: uses the Knowledge Agent Chat prompt, then sends recent in-session chat history to the Ollama-compatible `/api/chat` endpoint, capped at 20 messages. Memory resets when the browser session/page state resets.
- AI Task Draft: uses the Knowledge prompt for the task API formatter. Users only provide a pre-summary; the app adds that into the formatter prompt.
- AI Email Response: available on the Correspondence Team dashboard. Users provide the customer email and their summary findings, then the app generates a draft email response. The generated response can be copied from the tool.
- Feedback Coaching Rewrite: available from the dashboard and QC dashboard. Users enter feedback details, ask AI to rewrite into coaching-style content, review/edit the output, and save it as a PocketBase task on the Feedback board.

The AI flows read prompt text through `modules/prompts.js`, so Admin prompt edits in Knowledge are used by the AI flow immediately in that browser.

## Required Services

Life@Perch expects two services before the app is useful:

- PocketBase, reachable from local development and the deployed Cloudflare Pages domain.
- An Ollama-compatible HTTPS gateway, reachable from the browser and exposing `/api/tags` and `/api/chat`.

Do not expose a raw local Ollama instance or a PocketBase superuser token directly in the browser.

## Configure A Client Project

For this Perch checkout, `modules/config.js` currently uses:

```js
export const OLLAMA_BASE_URL = 'https://api.sereneai.co.uk';
export const POCKETBASE_BASE_URL = 'https://pocketbase.sereneai.co.uk';
export const POCKETBASE_COLLECTION = 'base_start_tasks';
export const POCKETBASE_USER_COLLECTION = 'base_start_users';
```

After creating a separate client project from this template, edit `modules/config.js`:

```js
export const OLLAMA_BASE_URL = 'https://ollama-gateway.example.com';
export const POCKETBASE_BASE_URL = 'https://pocketbase.example.com';
export const POCKETBASE_COLLECTION = 'base_start_tasks';
export const POCKETBASE_USER_COLLECTION = 'base_start_users';
```

Use real HTTPS service URLs before deploying to Cloudflare Pages.

## Run Locally

From the project folder:

```bash
python3 -m http.server 4177
```

Open:

```txt
http://127.0.0.1:4177
```

If port `4177` is already in use, choose another port:

```bash
python3 -m http.server 4178
```

If you use local services during development, temporarily update `modules/config.js` to point at your local PocketBase and gateway endpoints.

## Cloudflare Pages

Use these settings when connecting the GitHub repository:

- Framework preset: None/static
- Build command: leave blank
- Build output directory: `/`
- Root directory: repository root

See `docs/onboarding.md` for the full setup checklist. For Perch-specific onboarding, use `docs/perch-customer-setup-plan.md`.

## Repository Structure

```txt
index.html
styles.css
script.js
modules/
  auth.js
  chat.js
  config.js
  feedback.js
  pocketbaseClient.js
  prompts.js
  tasks.js
  ui.js
  utils.js
docs/
  onboarding.md
  pocketbase-schema.md
```

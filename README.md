# Life@Perch Operations Hub

Life@Perch is a no-build static operations dashboard for Perch teams. It includes PocketBase-backed login and tasks, static dashboard panels, team operations dashboards, Microsoft 365 quick links, a Knowledge prompt library, and an Ollama-compatible agent chat panel.

This repository can be used as a GitHub template and deployed to Cloudflare Pages. The current checkout is already configured for the Perch services in `modules/config.js`.

## Current Stats Overview

- App type: static HTML, CSS, and ES modules with no build step.
- Total project size reviewed: about 6,739 lines across app files, modules, and docs.
- Main app files: `index.html` (603 lines), `styles.css` (2,804 lines), `script.js` (358 lines).
- JavaScript modules: 7 modules across auth, chat, config, PocketBase, tasks, UI, and utilities.
- Documentation files: `README.md`, `docs/onboarding.md`, `docs/pocketbase-schema.md`, and `docs/perch-customer-setup-plan.md`.
- Current integrations: PocketBase at `https://pocketbase.sereneai.co.uk` and Ollama-compatible gateway at `https://api.sereneai.co.uk`.
- Current collections: `base_start_users` for auth and `base_start_tasks` for task records.
- Team dashboards currently configured: QC - Quality Control and Correspondence Team.
- Task statuses currently supported: New, To Do, Blocked, Hold, Completed.
- Local persistence: pinned team navigation uses `localStorage`; extra PocketBase token storage, where present, uses `sessionStorage`.

## What Is Included

- Static HTML, CSS, and JavaScript modules with no build step.
- PocketBase user login through the `base_start_users` auth collection.
- PocketBase task create, update, comments, and Kanban status handling through the `base_start_tasks` collection.
- Static dashboard layout with Quick Actions at the top, Quick Links below on the left, and PocketBase Tasks on the right.
- Operations page with team dashboard tiles and local pinned-team navigation.
- Team dashboards for QC - Quality Control and Correspondence Team.
- Correspondence Team AI Email Response tool for drafting customer replies from customer emails and internal findings.
- Agent chat through an Ollama-compatible `/api/chat` endpoint, with current-session chat memory capped at 20 messages.
- Knowledge page with minimisable prompt cards for the task API formatter and AI Email Response prompt.
- Client-editable service and area configuration in `modules/config.js`.
- Onboarding docs for GitHub template use, PocketBase, Ollama gateway setup, and Cloudflare Pages.

## Current Review Notes

The app is in a strong static-dashboard shape: the code is split into sensible modules, the syntax check passes, and the README/docs now line up with the current Perch configuration.

Quick possibilities:

- Wire the sidebar **Systems** item to a real page, or remove it until the page exists.
- Turn placeholder Quick Actions such as Project Links, Open Board, Client Workflow, New Review, Review Queue, Escalations, Guidance, Inbox, and Templates into real links or task actions.
- Move team dashboard definitions and quick links into `modules/config.js` so non-developers can adjust them without editing UI code.
- Add a small smoke-test checklist or Playwright test for login screen render, nav switching, modal open/close, prompt copy, and Kanban rendering.
- Add a visible refresh control to the dashboard task panel if users need manual task reload from the first screen; the current refresh button exists on the Tasks board.
- Add a clear "assigned to me" label to the dashboard task panel, because the dashboard filters to tasks assigned to the logged-in user while the Kanban can show all loaded tasks.

Issues or mismatches to watch:

- The sidebar shows **Systems**, but it has no `data-view` and no active page behind it.
- Several Quick Action tiles are visual placeholders only, which may feel like broken controls if users expect every tile to do something.
- The settings modal still says "Command Center User" and fallback names use "Command User"; the rest of the app is branded Life@Perch.
- The attachment field is named `attatchemnt`. This matches the documented PocketBase schema and current code, but it is intentionally misspelled and should only be renamed with a coordinated schema/code update.
- `README.md` previously showed placeholder service URLs even though the app is currently configured with live Perch endpoints.
- Local port `4177` may already be in use. Use another static-server port if needed.

## Current Dashboard Areas

- Dashboard: fixed Quick Actions, Quick Links, and assigned-to-me PocketBase Tasks panels.
- Operations: team dashboard tiles for QC and Correspondence, with pin/unpin controls that save locally in the browser.
- Team Dashboard: team-specific Quick Actions and Quick Links. The Correspondence dashboard includes the AI Email Response tool.
- Tasks: Kanban-style task board backed by PocketBase, with board filtering and drag/drop status updates.
- Knowledge: prompt library for operational AI prompts. Prompt cards can be minimised to show names only.

Pinned team navigation is stored in browser `localStorage` under `lifeAtPerchPinnedTeamDashboards`, so it is personal to the browser and does not affect other users.

## AI Tools

- Agent Chat: sends recent in-session chat history to the Ollama-compatible `/api/chat` endpoint, capped at 20 messages. Memory resets when the browser session/page state resets.
- AI Task Draft: uses the prompt library task API formatter. Users only provide a pre-summary; the app adds that into the formatter prompt.
- AI Email Response: available on the Correspondence Team dashboard. Users provide the customer email and their summary findings, then the app generates a draft email response. The generated response can be copied from the tool.

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
  pocketbaseClient.js
  tasks.js
  ui.js
  utils.js
docs/
  onboarding.md
  pocketbase-schema.md
```

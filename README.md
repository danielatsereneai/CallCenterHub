# Life@Perch Dashboard

Life@Perch is a no-build static operations dashboard for Perch teams. It includes PocketBase-backed login and tasks, static dashboard panels, team operations dashboards, Microsoft 365 quick links, a Knowledge prompt library, and an Ollama-compatible agent chat panel.

This repository is intended to be used as a GitHub template and deployed to Cloudflare Pages.

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

## Current Dashboard Areas

- Dashboard: fixed Quick Actions, Quick Links, and PocketBase Tasks panels.
- Operations: team dashboard tiles for QC and Correspondence, with pin/unpin controls that save locally in the browser.
- Team Dashboard: team-specific Quick Actions and Quick Links. The Correspondence dashboard includes the AI Email Response tool.
- Tasks: Kanban-style task board backed by PocketBase.
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

After creating a new project from this template, edit `modules/config.js`:

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

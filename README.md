# Life@Perch Dashboard

Life@Perch is a no-build static operations dashboard for Perch teams. It includes PocketBase-backed login and tasks, Kanban boards, Microsoft 365 quick links, and an Ollama-compatible agent chat panel.

This repository is intended to be used as a GitHub template and deployed to Cloudflare Pages.

## What Is Included

- Static HTML, CSS, and JavaScript modules with no build step.
- PocketBase user login through the `base_start_users` auth collection.
- PocketBase task create, update, comments, and Kanban status handling through the `base_start_tasks` collection.
- Agent chat through an Ollama-compatible `/api/chat` endpoint.
- Client-editable service and area configuration in `modules/config.js`.
- Onboarding docs for GitHub template use, PocketBase, Ollama gateway setup, and Cloudflare Pages.

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

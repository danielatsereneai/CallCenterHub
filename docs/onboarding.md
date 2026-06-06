# Life@Perch Onboarding

Use this checklist when setting up the Life@Perch dashboard.

## 1. Create The GitHub Project

1. Open the Life@Perch repository on GitHub.
2. Mark it as a template repository in repository settings if it is not already marked.
3. Select **Use this template**.
4. Create a private client repository.
5. Clone the new repository locally.

If you are setting up this source folder for the first time:

```bash
git init
git add .
git commit -m "Initial Life@Perch dashboard"
```

## 2. Configure Services

Edit `modules/config.js` for the client project:

```js
export const OLLAMA_BASE_URL = 'https://ollama-gateway.example.com';
export const POCKETBASE_BASE_URL = 'https://pocketbase.example.com';
export const POCKETBASE_COLLECTION = 'base_start_tasks';
export const POCKETBASE_USER_COLLECTION = 'base_start_users';
```

For Cloudflare Pages, both service URLs must be HTTPS and reachable from the browser.

## 3. Set Up PocketBase

Create the required PocketBase collections described in `docs/pocketbase-schema.md`.

Users should be created from the PocketBase Admin UI or another trusted admin process. The Life@Perch browser app does not include a public create-user form and should never ask a normal user for a superuser token.

Confirm CORS allows the local development URL and the final Cloudflare Pages domain.

## 4. Set Up The Ollama Gateway

Life@Perch calls:

```txt
GET /api/tags
POST /api/chat
```

The deployed browser app cannot call a developer machine's `localhost`. Put a controlled HTTPS gateway in front of the Ollama runtime, or use an internal network endpoint that the target users can reach.

The gateway should enforce the client project's access policy and only expose the endpoints this app needs.

## 5. Run Locally

```bash
python3 -m http.server 4177
```

Open:

```txt
http://127.0.0.1:4177
```

Log in with a PocketBase user created by the project admin. Confirm tasks load and the agent connection status matches the configured gateway.

## 6. Deploy To Cloudflare Pages

1. In Cloudflare, open **Workers & Pages**.
2. Choose **Create application** then **Pages**.
3. Connect the client GitHub repository.
4. Use these build settings:

```txt
Framework preset: None/static
Build command: blank
Build output directory: /
Root directory: repository root
```

5. Deploy.
6. Add the deployed Pages URL to PocketBase CORS.
7. Re-test login, task loading, task save/update, Kanban movement, and chat.

## Release Checklist

- `modules/config.js` points at client service URLs.
- PocketBase collections and rules are in place.
- Users are created in PocketBase Admin UI.
- Cloudflare Pages is connected to the GitHub repository.
- PocketBase CORS includes local development and Pages domains.
- No browser screen asks for a PocketBase superuser token.

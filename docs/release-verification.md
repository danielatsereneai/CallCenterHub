# Release Verification

Use this checklist before treating the app as production-ready.

## Local Gates

Run:

```bash
npm run verify
```

This runs JavaScript syntax checks, unit/static tests, and the no-dependency static smoke test.

## Service Reachability

Run the production verifier without printing secrets:

```bash
POCKETBASE_BASE_URL="https://pocketbase.example.com" \
OLLAMA_BASE_URL="https://ollama-gateway.example.com" \
npm run verify:production
```

For authenticated collection checks, add a low-privilege test user:

```bash
PB_TEST_USER_EMAIL="standard-user@example.com" \
PB_TEST_USER_PASSWORD="..." \
POCKETBASE_BASE_URL="https://pocketbase.example.com" \
OLLAMA_BASE_URL="https://ollama-gateway.example.com" \
npm run verify:production
```

Do not paste real passwords into chat, screenshots, commits, or issue comments.

## PocketBase Rules

Create or confirm these collections:

- `base_start_users`
- `base_start_tasks`
- `base_start_task_comments`

Apply the org-scoped rules in `docs/pocketbase-schema.md`.

Verify with at least two standard users in different orgs:

- User A can list and update only User A org tasks.
- User B can list and update only User B org tasks.
- User A cannot fetch User B org tasks by direct record URL.
- User A cannot update User B org tasks by direct record URL.
- User A cannot list User B task comments.
- Admin users can perform cross-org support actions intentionally.

## AI Gateway

Confirm the controls documented in `docs/ai-gateway-security.md`:

- Auth or network restriction is enabled.
- Allowed origins are limited to approved app origins.
- Prompt/response logging policy is approved.
- Retention and deletion process is approved.
- Rate limits and abuse monitoring are enabled.
- Customer and agent data handling is approved.

## Cloudflare Pages

After deployment:

- Confirm `_headers` is deployed by checking response headers.
- Confirm direct deep links return `index.html` through `_redirects`.
- Confirm the deployed origin is allowed in PocketBase CORS.
- Run login, task load, task save/update, Kanban move, task chat, feedback save/reload, prompt copy, and AI email generation smoke tests.

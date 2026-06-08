# Troubleshooting

## Login Fails

- Confirm `POCKETBASE_BASE_URL` in `modules/config.js` points at the intended HTTPS PocketBase instance.
- Confirm the user exists in `base_start_users`.
- Confirm the user is verified if the collection requires verification.
- Confirm PocketBase CORS allows the local or deployed app origin.
- Check browser console/network errors without copying passwords or tokens.

## Tasks Do Not Load

- Confirm `base_start_tasks` exists.
- Confirm the authenticated user has `user_type` and `org_id` fields.
- Confirm the user's `org_id` exactly matches task `board_name` values, for example `PerchGroup`.
- Confirm the org-scoped rules in `docs/pocketbase-schema.md` are applied.
- Run `npm run verify:production` with a low-privilege test user.

## Task Chat Fails

- Confirm `base_start_task_comments` exists.
- Confirm `task_id` is a relation to `base_start_tasks`.
- Confirm comment collection rules can read/create comments for tasks in the user's org.
- Older deployments may fall back to task `Json.task_comments`, but production should use the comments collection.

## AI Features Fail

- Confirm `OLLAMA_BASE_URL` points at the approved gateway.
- Confirm `GET /api/tags` succeeds.
- Confirm `POST /api/chat` is allowed from the app origin.
- Confirm the gateway has not rejected the request for auth, origin, size, or rate-limit reasons.
- Confirm the request does not exceed the model/gateway context limits.

## Cloudflare Pages Issues

- Confirm the build output directory is `/`.
- Confirm `_headers` is deployed by inspecting response headers.
- Confirm `_redirects` is deployed by opening a deep link and checking that the app shell loads.
- Clear Cloudflare cache after changing static headers or config files.

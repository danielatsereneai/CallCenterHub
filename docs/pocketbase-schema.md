# PocketBase Schema

Life@Perch uses PocketBase for user auth and task records. Collection names can be changed in `modules/config.js`, but this project currently keeps the existing defaults.

## `base_start_users`

Create this as an auth collection.

Recommended fields:

```txt
name: text
user_type: select, required, options: Admin, User
org_id: select, required, options: PerchGroup, ACI, Connect, TML, Verify
```

Use PocketBase's built-in auth fields for email, password, verified state, created, and updated timestamps.

Users should be created in the PocketBase Admin UI or another trusted admin-only process. Do not expose superuser tokens in the browser app.

## `base_start_tasks`

Create this as a base collection.

Recommended fields:

```txt
due_date: date
task_name: text, required
task_description: editor or text
assigned: relation to base_start_users, single, optional
board_name: text
task_status: select
Json: json
Notes: editor or text
task_id: number
attatchemnt: file, optional
```

`task_status` options:

```txt
new
todo
blocked
hold
completed
```

The file field is intentionally listed as `attatchemnt` because the current app uses that existing field name. Rename it only if you update the matching form and API code at the same time.

## `base_start_task_comments`

Create this as a base collection. Task chat should use this collection instead of storing comments inside the task `Json` field. The app still has a legacy fallback for older deployments, but production setups should create this collection before release.

Recommended fields:

```txt
task_id: relation to base_start_tasks, single, required
body: text, required
user_id: text
user_name: text
user_email: email
```

## Suggested Rules

Start strict and relax only when the project needs broader visibility.

For `base_start_users`:

```txt
List/search: @request.auth.id != "" && @request.auth.user_type = "Admin"
View: @request.auth.id = id || @request.auth.user_type = "Admin"
Create: admin only
Update: @request.auth.id = id
Delete: admin only
```

For `base_start_tasks`:

```txt
List/search: @request.auth.id != "" && (
  @request.auth.user_type = "Admin" ||
  board_name = @request.auth.org_id
)
View: @request.auth.id != "" && (
  @request.auth.user_type = "Admin" ||
  board_name = @request.auth.org_id
)
Create: @request.auth.id != "" && (
  @request.auth.user_type = "Admin" ||
  board_name = @request.auth.org_id
)
Update: @request.auth.id != "" && (
  @request.auth.user_type = "Admin" ||
  board_name = @request.auth.org_id
)
Delete: admin only
```

For `base_start_task_comments`:

```txt
List/search: @request.auth.id != "" && (
  @request.auth.user_type = "Admin" ||
  task_id.board_name = @request.auth.org_id
)
View: @request.auth.id != "" && (
  @request.auth.user_type = "Admin" ||
  task_id.board_name = @request.auth.org_id
)
Create: @request.auth.id != "" && (
  @request.auth.user_type = "Admin" ||
  task_id.board_name = @request.auth.org_id
)
Update: @request.auth.user_type = "Admin"
Delete: @request.auth.user_type = "Admin"
```

Use board labels in `org_id` exactly as they appear in task `board_name`. For example, use `PerchGroup`, not `Perch`, if the user's default board is `PerchGroup`.

## CORS

Allow the local development origin and the Cloudflare Pages domain:

```txt
http://127.0.0.1:4177
https://your-project.pages.dev
https://your-client-domain.example
```

If Cloudflare Pages uses a preview branch URL, add that origin while testing.

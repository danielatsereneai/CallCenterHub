# SELF REVIEW

Review date: 2026-06-08
Remediation update: 2026-06-08

## 1. Project Summary

Life@Perch Operations Hub is a no-build static browser app made from `index.html`, `styles.css`, `script.js`, and ES modules in `modules/`. It provides PocketBase-backed login, task boards, dashboard quick links, team dashboards, feedback submission workflows, local prompt customization, and an Ollama-compatible AI chat/email/task-drafting experience.

The app currently points at production-like public service URLs in `modules/config.js:3-4`:

- `https://api.sereneai.co.uk`
- `https://pocketbase.sereneai.co.uk`

The repository now includes a lightweight Node test harness, Cloudflare Pages `_headers` and `_redirects`, and production setup documentation. It remains a static app with no server code or bundled API routes in this repository.

## 2. Current Architecture Overview

- Static entry point: `index.html` defines the login screen, dashboard, operations view, tasks view, knowledge view, modals, and chat panel.
- Styling: `styles.css` contains all app styling and responsive behavior.
- App bootstrap: `script.js` collects DOM references, creates controllers, hydrates auth state, binds events, and starts authenticated flows.
- Auth/session: `modules/auth.js` stores PocketBase auth data in `sessionStorage` and removes legacy `localStorage` auth data when encountered.
- PocketBase client: `modules/pocketbaseClient.js` calls PocketBase collection APIs directly from the browser.
- Tasks: `modules/tasks.js` handles task loading, board filtering, task create/update, Kanban status moves, assignment options, and task chat through `base_start_task_comments` with a legacy `Json` fallback.
- AI/chat: `modules/chat.js` calls an Ollama-compatible `/api/tags` and `/api/chat` endpoint directly from the browser.
- Feedback: `modules/feedback.js` generates coaching feedback through the chat controller and stores feedback as PocketBase task records.
- Prompts: `modules/prompts.js` reads defaults from `modules/config.js` and stores custom prompt overrides in browser `localStorage`.
- Docs: `README.md`, `docs/onboarding.md`, `docs/pocketbase-schema.md`, and `docs/perch-customer-setup-plan.md` document setup and schema expectations.

## 3. What Works Well

- The app is simple to deploy as static assets and has no fragile build chain.
- JavaScript is split into understandable modules by responsibility.
- User-generated text inserted with `innerHTML` is generally passed through `escapeHtml()` first, for example task cards in `modules/tasks.js:735-751`, feedback documents in `modules/feedback.js:190-216`, and chat messages in `modules/ui.js:720-740`.
- PocketBase pagination is handled for task list loading in `modules/pocketbaseClient.js:69-107`.
- Task status normalization supports common variants in `modules/utils.js:119-135`.
- The README and onboarding docs clearly state the expected external services and Cloudflare Pages setup.
- The visible app shell loads locally with no browser console errors in the static smoke check.

## 4. Critical Issues

1. Live PocketBase authorization still must be verified outside this repo.
   - The repo documentation now recommends org-scoped rules in `docs/pocketbase-schema.md`.
   - Production readiness still requires applying and testing those rules in the live PocketBase instance.

2. Browser-readable auth tokens remain an inherent static-app tradeoff, but exposure has been reduced.
   - `modules/auth.js` now uses `sessionStorage` for auth sessions and clears legacy `localStorage` auth.
   - Production still needs short token lifetimes, revocation guidance, CSP, and strict server rules.

3. Sensitive operational text is sent directly from the browser to the configured AI gateway.
   - `modules/chat.js:246-255` sends all AI prompts/messages to `${baseUrl}/api/chat`.
   - Feedback notes, customer emails, task summaries, and agent email addresses can be included in prompts via `modules/chat.js:451-475` and `modules/feedback.js:122-148`.
   - The repo now documents required gateway controls in `docs/ai-gateway-security.md`.
   - Production readiness still requires verifying the real gateway implementation and policy.

## 5. Security Risks

- PocketBase collection rules must be applied and verified in the live backend. The repo docs now specify org-scoped rules for tasks and task comments.
- Admin capabilities are UI-level only for prompt editing. `script.js:265-267` sets edit permission from the current user record, while `modules/prompts.js:70-72` saves custom prompts only to local browser storage. This is not server-side authorization and should not be treated as a secure admin feature.
- `modules/tasks.js` now avoids loading the user list for standard users; admins can still load assignment options.
- Auth/session data is stored in `sessionStorage` in `modules/auth.js`.
- `_headers` now defines CSP, frame, referrer, permissions, and content-type protections for Cloudflare Pages.
- Runtime service overrides are now supported through self-hosted `config.runtime.js`; deployments still need to keep `_headers` `connect-src` aligned with configured origins.
- The Perch logo is loaded from an external URL in `index.html:18` and `index.html:50`, which adds a third-party availability/privacy dependency.

## 6. Bugs Or Broken Flows

1. Feedback visibility has been fixed in code.
   - Feedback tasks are saved to the user's allowed org-scoped board while retaining feedback metadata in `Json`.

2. Task comments have been moved to a dedicated collection path.
   - `base_start_task_comments` is now documented and used by the client.
   - A legacy `Json.task_comments` fallback remains for older deployments until the new collection is created.

3. Attachment edit support has been improved.
   - Existing attachments are shown in the task modal.
   - Editing a task can upload a replacement attachment.

4. Stale manual PocketBase token DOM references were removed from runtime wiring.

5. Legacy "Command User/Command Center" branding was replaced with "Life@Perch User".

## 7. Code Quality Concerns

- `modules/tasks.js` is large at 1086 lines and mixes data access decisions, rendering, modal state, board filtering, assignment normalization, comments, and drag/drop behavior.
- `styles.css` is large at 3454 lines and likely contains historical duplication. This makes layout regressions harder to reason about.
- Team dashboard definitions now live in `modules/config.js`.
- Clipboard handling is centralized in `modules/utils.js`.
- Several features rely on direct DOM lookups by ID inside controllers instead of using collected DOM references consistently, for example `modules/tasks.js:599-629`.
- Error handling often displays raw backend error messages to users, for example `script.js:204-207` and `modules/tasks.js:424-427`. That is useful for debugging but may leak implementation details in production.

## 8. Performance Concerns

- Task loading fetches all pages of matching task records into memory in `modules/pocketbaseClient.js:69-107`. This can become slow for large task collections.
- Dashboard, Kanban, and board controls rerender large chunks of HTML after many operations, for example `modules/tasks.js:417-423`, `modules/tasks.js:541-550`, and `modules/tasks.js:950-966`.
- Each refresh can also load users, up to 100 records, in `modules/tasks.js:62-83` and `modules/pocketbaseClient.js:27-37`.
- AI requests now have a timeout. Retry/backoff behavior is still not implemented.
- There is no asset bundling, cache-busting, or minification; Cloudflare `_headers` now supplies security headers.

## 9. Missing Tests

- `package.json` now provides `check:syntax`, `test`, and `verify` scripts.
- Unit tests now cover key utility and session-storage behavior.
- No integration tests for login, task loading, task create/update, Kanban drag/drop, feedback save, prompt editing, or AI error handling.
- A no-dependency static smoke test is committed and runs in `npm run verify`.
- No accessibility tests for modals, focus trapping, keyboard navigation, or ARIA state.
- No automated live schema/rule validation for PocketBase access control; `docs/release-verification.md` documents the manual verification steps.

## 10. Missing Documentation

- Production PocketBase rule guidance now documents org-scoped read/update access.
- AI gateway auth, logging, retention, rate limiting, and allowed-origin requirements are now documented in `docs/ai-gateway-security.md`.
- Runtime environment overrides are documented in `docs/configuration.md`; there is still no secret-bearing environment system because this is a public static app.
- `_headers` now defines CSP and baseline security headers.
- `docs/session-incident-runbook.md` now covers compromised browser sessions and PocketBase token/account response.
- `docs/troubleshooting.md` now covers common PocketBase CORS/auth failures and Ollama gateway failures.
- `docs/release-verification.md` now covers release security verification, smoke testing, and data privacy review.

## 11. Deployment/Setup Risks

- Cloudflare Pages `_headers` and `_redirects` files now exist.
- Staging/production service overrides can now be handled through `config.runtime.js`.
- `docs/onboarding.md` and `.vscode/tasks.json` now use port `4177`.
- `.codex-mobile-review/*.png` files were removed from version control and the folder is ignored.
- PocketBase schema uses a misspelled file field, `attatchemnt`, documented in `docs/pocketbase-schema.md:35` and used in `index.html:499` and `modules/pocketbaseClient.js:110-125`. This is workable but fragile.

## 12. Recommended Fixes, Ordered By Priority

### P0 Critical

1. Apply and verify the documented PocketBase rules in the live backend.
   - Do not rely on browser filtering for security.
   - Confirm standard users cannot read or update another org's tasks/comments via direct API calls.

2. Verify the real AI gateway security boundary.
   - Confirm auth, allowed origins, logging, retention, rate limits, and whether customer/agent data may be sent to it.
   - Add a production privacy review before releasing AI email/feedback flows.

3. Validate the deployed Cloudflare security headers.
   - Confirm Pages is serving the repository `_headers` file in production.

### P1 Important

1. Reduce token exposure.
   - Prefer short-lived tokens, session-only storage, refresh handling, and server-side revocation guidance.
   - If the app remains static, explicitly document the accepted risk of browser-readable tokens.

2. Create the `base_start_task_comments` collection in PocketBase before release.

3. Add full browser automation coverage for modal open/close, task rendering, and knowledge tabs.

### P2 Improvement

1. Split `modules/tasks.js` into task API/state, render helpers, task form, comments, and Kanban modules.
2. Add attachment remove support.
3. Add user-facing, less technical error messages while keeping detailed logs for developers.
4. Rename `attatchemnt` through a coordinated schema/code migration when convenient.
5. Add retry/backoff for AI gateway failures.

## 13. Files Reviewed

- `.gitignore`
- `.vscode/tasks.json`
- `_headers`
- `_redirects`
- `README.md`
- `SELF_REVIEW.md`
- `docs/ai-gateway-security.md`
- `docs/configuration.md`
- `docs/onboarding.md`
- `docs/perch-customer-setup-plan.md`
- `docs/pocketbase-schema.md`
- `docs/release-verification.md`
- `docs/session-incident-runbook.md`
- `docs/troubleshooting.md`
- `index.html`
- `config.runtime.js`
- `script.js`
- `styles.css`
- `modules/auth.js`
- `modules/chat.js`
- `modules/config.js`
- `modules/feedback.js`
- `modules/pocketbaseClient.js`
- `modules/prompts.js`
- `modules/tasks.js`
- `modules/ui.js`
- `modules/utils.js`
- `package.json`
- `scripts/smoke-static.mjs`
- `scripts/verify-production.mjs`
- `tests/auth.test.js`
- `tests/static.test.js`
- `tests/utils.test.js`

## 14. Questions Or Assumptions

- I did not verify live PocketBase collection rules. The remaining security gate is applying and testing the documented rules in the live backend.
- I did not verify the live Ollama-compatible gateway implementation at `https://api.sereneai.co.uk`; it is not included in this repo.
- I did not authenticate with real user credentials, so authenticated task save/update flows were reviewed statically rather than tested against production data.
- I assume task records may contain customer, agent, or operationally sensitive data because the UI includes customer email drafting, feedback notes, agent emails, and task notes.
- I assume Cloudflare Pages is the target deployment because the README and onboarding docs say so.
- I assume `.codex-mobile-review` screenshots are not required runtime assets because no app file references them; they have been removed from version control.

## 15. Final Readiness Score Out Of 10

7/10 for production release.

The repo-owned release blockers from the first audit are substantially improved: it now has session-only auth persistence, org-scoped rule documentation, task comments as a collection, security headers, tests, deployment docs, AI gateway policy docs, stale-code cleanup, attachment display/upload support, and cleaner branding. The remaining blockers are external verification of live PocketBase rules and live AI gateway controls, plus deeper browser/accessibility coverage.

## Commands Run And Results

```bash
find . -maxdepth 3 -type f | sort
```

Result: listed static app files, docs, `.vscode/tasks.json`, tracked `.codex-mobile-review` PNGs, and git metadata. No package/build/deployment files were found in the application tree.

```bash
git status --short
```

Result: clean before this review file was created.

```bash
rg -n "TODO|FIXME|token|password|auth|fetch\\(|localStorage|sessionStorage|innerHTML|insertAdjacentHTML|eval|danger|api/|PocketBase|Cloudflare|deploy|environment|env|CORS|rule|Admin|User Type|org_id|attatchemnt" .
```

Result: found the key auth, storage, PocketBase, AI fetch, rendering, docs, and schema references used in this review.

```bash
wc -l index.html styles.css script.js modules/*.js README.md docs/*.md
```

Result: 8508 total lines. Notable large files: `styles.css` 3454 lines, `modules/tasks.js` 1086 lines, `modules/ui.js` 811 lines.

```bash
for f in script.js modules/*.js; do node --check "$f" || exit 1; done
```

Result: passed. No JavaScript syntax errors found.

```bash
find . -maxdepth 2 \( -name 'package.json' -o -name 'package-lock.json' -o -name 'pnpm-lock.yaml' -o -name 'yarn.lock' -o -name 'vite.config.*' -o -name 'wrangler.toml' -o -name '_headers' -o -name '_redirects' -o -name '.env*' \) -print | sort
```

Result: no output. There is no package manifest, lockfile, Vite config, Cloudflare Wrangler config, Pages `_headers`, Pages `_redirects`, or environment file in the searched paths.

```bash
git ls-files | sort
```

Result: confirmed tracked files include app source, docs, `.vscode/tasks.json`, `.gitignore`, and `.codex-mobile-review/*.png`.

```bash
python3 -m http.server 4178
```

Result: started a local static server successfully for the smoke check, then stopped it.

Browser smoke check at `http://localhost:4178/`:

Result:

```json
{
  "smoke": {
    "authVisible": true,
    "hasLoginForm": true,
    "moduleScript": "script.js",
    "navItems": [
      "⌘Dashboard",
      "◇Operations",
      "✓Tasks",
      "▤Knowledge"
    ],
    "title": "Life@Perch"
  },
  "errors": []
}
```

This confirms the static app shell loads, the login form is visible, the module script is present, the expected nav items render, and there were no browser console errors on initial load.

```bash
npm run verify
```

Result after remediation: passed. `check:syntax` ran `node --check` against `script.js`, every file in `modules/`, and every test file. `node --test` ran 10 tests covering session-storage auth migration, Cloudflare headers, stale token-control removal, runtime config loading, branding cleanup, HTML escaping, status normalization, org-board normalization, JSON parsing, and assignment normalization. `npm run smoke` started a temporary local static server and verified the app shell, runtime config file, module files, CSP file, nav, task modal, knowledge tabs, and stale branding removal.

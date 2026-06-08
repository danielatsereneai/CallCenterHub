# Session And Token Incident Runbook

Use this when a user account, browser session, or PocketBase token may be compromised.

## Immediate Containment

1. Disable or delete the affected PocketBase user session/account in the PocketBase Admin UI.
2. Ask the user to close all Life@Perch browser tabs.
3. Ask the user to clear site data for the deployed Life@Perch origin.
4. Reset the user's PocketBase password.
5. Review recent task/comment changes made by that user.

The browser app stores the PocketBase auth session in `sessionStorage`, so closing the tab clears normal session state. A malicious extension or successful XSS could still read browser-accessible tokens while a tab is open, which is why backend revocation is the source of truth.

## Follow-Up

- Confirm PocketBase token lifetime and refresh settings are appropriate for the client.
- Confirm `_headers` is deployed and serving the expected CSP.
- Confirm the affected browser has no untrusted extensions.
- Review PocketBase logs for unusual record reads/updates.
- Review AI gateway logs only according to the approved logging and retention policy.

## Recovery

After reset, have the user log in again and verify:

- Dashboard loads.
- Tasks are scoped to the expected org.
- Task comments work.
- Feedback save/reload works.

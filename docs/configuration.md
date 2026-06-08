# Configuration

Life@Perch is static and has no build-time environment loader. Runtime service configuration is provided by the self-hosted `config.runtime.js` file, which is loaded before `script.js`.

For each environment, edit or replace `config.runtime.js`:

```js
window.LIFE_AT_PERCH_CONFIG = {
    OLLAMA_BASE_URL: 'https://ollama-gateway.example.com',
    POCKETBASE_BASE_URL: 'https://pocketbase.example.com',
    POCKETBASE_COLLECTION: 'base_start_tasks',
    POCKETBASE_USER_COLLECTION: 'base_start_users',
    POCKETBASE_COMMENT_COLLECTION: 'base_start_task_comments',
};
```

Leave values commented or omitted to use the defaults in `modules/config.js`.

Do not put secrets in `config.runtime.js`. It is publicly served to every browser.

For Cloudflare Pages:

- Use one branch/project per environment, or replace `config.runtime.js` as part of the deployment process.
- Ensure `_headers` allows the configured PocketBase and AI gateway origins in `connect-src`.
- Ensure PocketBase CORS allows the deployed app origin.

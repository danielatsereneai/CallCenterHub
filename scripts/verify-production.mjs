const required = name => {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Missing ${name}. Set it without printing the value, then rerun this script.`);
    }
    return value.replace(/\/$/, '');
};

const optional = name => process.env[name]?.trim() || '';

async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    let body = null;
    try {
        body = await response.json();
    } catch {
        body = null;
    }
    return { response, body };
}

async function main() {
    const pocketBaseUrl = required('POCKETBASE_BASE_URL');
    const aiGatewayUrl = required('OLLAMA_BASE_URL');
    const email = optional('PB_TEST_USER_EMAIL');
    const password = optional('PB_TEST_USER_PASSWORD');
    const userCollection = optional('POCKETBASE_USER_COLLECTION') || 'base_start_users';
    const taskCollection = optional('POCKETBASE_COLLECTION') || 'base_start_tasks';
    const commentCollection = optional('POCKETBASE_COMMENT_COLLECTION') || 'base_start_task_comments';

    const results = [];

    const health = await fetchJson(`${pocketBaseUrl}/api/health`);
    results.push(['PocketBase health', health.response.ok]);

    const tags = await fetchJson(`${aiGatewayUrl}/api/tags`);
    results.push(['AI gateway tags', tags.response.ok]);

    if (email && password) {
        const auth = await fetchJson(`${pocketBaseUrl}/api/collections/${userCollection}/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: email, password }),
        });
        results.push(['PocketBase test-user auth', auth.response.ok]);

        const token = auth.body?.token;
        if (token) {
            const headers = { Authorization: token };
            const tasks = await fetchJson(`${pocketBaseUrl}/api/collections/${taskCollection}/records?page=1&perPage=1`, { headers });
            const comments = await fetchJson(`${pocketBaseUrl}/api/collections/${commentCollection}/records?page=1&perPage=1`, { headers });
            results.push(['Task collection readable by test user', tasks.response.ok]);
            results.push(['Task comments collection readable by test user', comments.response.ok]);
        }
    } else {
        results.push(['PocketBase authenticated collection checks', 'skipped: set PB_TEST_USER_EMAIL and PB_TEST_USER_PASSWORD']);
    }

    for (const [name, ok] of results) {
        console.log(`${ok === true ? 'PASS' : ok === false ? 'FAIL' : 'SKIP'} ${name}${typeof ok === 'string' ? ` (${ok})` : ''}`);
    }

    if (results.some(([, ok]) => ok === false)) {
        throw new Error('Production verification failed.');
    }
}

main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});

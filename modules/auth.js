export function createSessionStore({ authStorageKey }) {
    function hydrateAuthSession() {
        const storedAuth = sessionStorage.getItem(authStorageKey) || localStorage.getItem(authStorageKey);
        localStorage.removeItem(authStorageKey);
        if (!storedAuth) return { record: null, token: '' };

        try {
            const parsedAuth = JSON.parse(storedAuth);
            return {
                record: parsedAuth.record || null,
                token: parsedAuth.token || '',
            };
        } catch {
            clearAuthSession();
            return { record: null, token: '' };
        }
    }

    function persistAuthSession(authData) {
        localStorage.removeItem(authStorageKey);
        sessionStorage.setItem(authStorageKey, JSON.stringify({
            token: authData.token,
            record: authData.record,
        }));
    }

    function clearAuthSession() {
        localStorage.removeItem(authStorageKey);
        sessionStorage.removeItem(authStorageKey);
    }

    return {
        hydrateAuthSession,
        persistAuthSession,
        clearAuthSession,
    };
}

export function createSessionStore({ authStorageKey, tokenStorageKey }) {
    function hydrateAuthSession() {
        const storedAuth = localStorage.getItem(authStorageKey);
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
        localStorage.setItem(authStorageKey, JSON.stringify({
            token: authData.token,
            record: authData.record,
        }));
    }

    function clearAuthSession() {
        localStorage.removeItem(authStorageKey);
    }

    function hydratePocketBaseToken() {
        return sessionStorage.getItem(tokenStorageKey) || '';
    }

    function persistPocketBaseToken(token) {
        if (token) {
            sessionStorage.setItem(tokenStorageKey, token);
        } else {
            sessionStorage.removeItem(tokenStorageKey);
        }
    }

    function clearPocketBaseToken() {
        sessionStorage.removeItem(tokenStorageKey);
    }

    return {
        hydrateAuthSession,
        persistAuthSession,
        clearAuthSession,
        hydratePocketBaseToken,
        persistPocketBaseToken,
        clearPocketBaseToken,
    };
}

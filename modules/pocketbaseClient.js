import {
    POCKETBASE_BASE_URL,
    POCKETBASE_COMMENT_COLLECTION,
    POCKETBASE_COLLECTION,
    POCKETBASE_USER_COLLECTION,
} from './config.js';
import { appendFormDataValue } from './utils.js';

export function createPocketBaseClient({
    baseUrl = POCKETBASE_BASE_URL,
    commentCollection = POCKETBASE_COMMENT_COLLECTION,
    taskCollection = POCKETBASE_COLLECTION,
    userCollection = POCKETBASE_USER_COLLECTION,
} = {}) {
    async function authenticateCommandUser(email, password) {
        const response = await fetch(`${baseUrl}/api/collections/${userCollection}/auth-with-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                identity: email,
                password,
            }),
        });
        return parseOrThrow(response);
    }

    async function loadAvailableUsers(token) {
        const params = new URLSearchParams({
            page: '1',
            perPage: '100',
            sort: 'name,email',
        });
        const response = await fetch(`${baseUrl}/api/collections/${userCollection}/records?${params}`, {
            method: 'GET',
            headers: buildAuthHeaders(token),
        });
        return parseOrThrow(response);
    }

    async function fetchCurrentUserProfile(userId, token) {
        const headers = buildAuthHeaders(token);
        const response = await fetch(`${baseUrl}/api/collections/${userCollection}/records/${encodeURIComponent(userId)}`, {
            method: 'GET',
            headers,
        });
        const result = await parsePocketBaseResponse(response);

        if (response.ok) {
            return result;
        }

        return refreshCurrentUserProfile(headers, getPocketBaseErrorMessage(response, result));
    }

    async function refreshCurrentUserProfile(headers, originalErrorMessage) {
        const response = await fetch(`${baseUrl}/api/collections/${userCollection}/auth-refresh`, {
            method: 'POST',
            headers,
        });
        const result = await parsePocketBaseResponse(response);

        if (!response.ok) {
            throw new Error(originalErrorMessage || getPocketBaseErrorMessage(response, result));
        }

        return result;
    }

    async function fetchPocketBaseTasks(token, options = {}) {
        const perPage = options.perPage || 100;
        const filter = buildTaskListFilter(options.boardNames);
        const allItems = [];
        let page = 1;
        let totalPages = 1;
        let lastResult = null;

        do {
            const params = new URLSearchParams({
                page: String(page),
                perPage: String(perPage),
                sort: '-created',
            });

            if (filter) {
                params.set('filter', filter);
            }

            const response = await fetch(`${baseUrl}/api/collections/${taskCollection}/records?${params}`, {
                method: 'GET',
                headers: buildAuthHeaders(token),
            });
            const result = await parseOrThrow(response);
            allItems.push(...(result.items || []));
            lastResult = result;
            totalPages = Number(result.totalPages) || 1;
            page += 1;
        } while (page <= totalPages);

        return {
            ...(lastResult || {}),
            page: 1,
            perPage,
            totalItems: allItems.length,
            totalPages: 1,
            items: allItems,
        };
    }

    async function createPocketBaseTask(taskData, token) {
        const hasAttachment = Boolean(taskData.attatchemnt);
        const headers = buildAuthHeaders(token);
        let body;

        if (hasAttachment) {
            body = new FormData();
            appendFormDataValue(body, 'due_date', taskData.due_date);
            appendFormDataValue(body, 'task_name', taskData.task_name);
            appendFormDataValue(body, 'task_description', taskData.task_description);
            appendFormDataValue(body, 'assigned', taskData.assigned);
            appendFormDataValue(body, 'board_name', taskData.board_name);
            appendFormDataValue(body, 'task_status', taskData.task_status);
            appendFormDataValue(body, 'Json', taskData.Json ? JSON.stringify(taskData.Json) : '');
            appendFormDataValue(body, 'Notes', taskData.Notes);
            appendFormDataValue(body, 'task_id', taskData.task_id);
            body.append('attatchemnt', taskData.attatchemnt);
        } else {
            headers['Content-Type'] = 'application/json';
            const payload = {
                due_date: taskData.due_date,
                task_name: taskData.task_name,
                task_description: taskData.task_description,
                board_name: taskData.board_name,
                task_status: taskData.task_status,
                Json: taskData.Json,
                Notes: taskData.Notes,
                task_id: taskData.task_id,
            };

            if (taskData.assigned) {
                payload.assigned = taskData.assigned;
            }

            body = JSON.stringify(payload);
        }

        const response = await fetch(`${baseUrl}/api/collections/${taskCollection}/records`, {
            method: 'POST',
            headers,
            body,
        });
        return parseOrThrow(response);
    }

    async function updatePocketBaseTask(recordId, taskData, token, includeBoardAlias = true) {
        const hasAttachment = Boolean(taskData.attatchemnt);
        const headers = buildAuthHeaders(token);
        const payload = {
            due_date: taskData.due_date,
            task_name: taskData.task_name,
            task_description: taskData.task_description,
            board_name: taskData.board_name,
            task_status: taskData.task_status,
            Json: taskData.Json,
            Notes: taskData.Notes,
            task_id: taskData.task_id,
        };

        if (includeBoardAlias) {
            payload.Board_Name = taskData.board_name;
        }

        if (taskData.assigned) {
            payload.assigned = taskData.assigned;
        }

        if (taskData.removeAttachment) {
            payload.attatchemnt = null;
        }

        let body;
        if (hasAttachment) {
            body = new FormData();
            Object.entries(payload).forEach(([key, value]) => {
                appendFormDataValue(body, key, key === 'Json' ? JSON.stringify(value) : value);
            });
            body.append('attatchemnt', taskData.attatchemnt);
        } else {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(payload);
        }

        const response = await fetch(`${baseUrl}/api/collections/${taskCollection}/records/${encodeURIComponent(recordId)}`, {
            method: 'PATCH',
            headers,
            body,
        });
        return parseOrThrow(response);
    }

    async function patchPocketBaseTaskStatus(recordId, payload, token) {
        const response = await fetch(`${baseUrl}/api/collections/${taskCollection}/records/${encodeURIComponent(recordId)}`, {
            method: 'PATCH',
            headers: {
                ...buildAuthHeaders(token),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        return parseOrThrow(response);
    }

    async function patchPocketBaseTaskComments(recordId, taskJson, token) {
        const response = await fetch(`${baseUrl}/api/collections/${taskCollection}/records/${encodeURIComponent(recordId)}`, {
            method: 'PATCH',
            headers: {
                ...buildAuthHeaders(token),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Json: taskJson,
            }),
        });
        return parseOrThrow(response);
    }

    async function fetchTaskComments(recordId, token) {
        const params = new URLSearchParams({
            page: '1',
            perPage: '100',
            sort: 'created',
            filter: `task_id = ${JSON.stringify(recordId)}`,
        });
        const response = await fetch(`${baseUrl}/api/collections/${commentCollection}/records?${params}`, {
            method: 'GET',
            headers: buildAuthHeaders(token),
        });
        return parseOrThrow(response);
    }

    async function createTaskComment(recordId, comment, token) {
        const response = await fetch(`${baseUrl}/api/collections/${commentCollection}/records`, {
            method: 'POST',
            headers: {
                ...buildAuthHeaders(token),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                task_id: recordId,
                body: comment.body,
                user_id: comment.user_id,
                user_name: comment.user_name,
                user_email: comment.user_email,
            }),
        });
        return parseOrThrow(response);
    }

    return {
        authenticateCommandUser,
        loadAvailableUsers,
        fetchCurrentUserProfile,
        fetchPocketBaseTasks,
        createPocketBaseTask,
        updatePocketBaseTask,
        patchPocketBaseTaskStatus,
        patchPocketBaseTaskComments,
        fetchTaskComments,
        createTaskComment,
    };
}

function buildAuthHeaders(token) {
    return token ? { Authorization: token } : {};
}

function buildTaskListFilter(boardNames) {
    if (!Array.isArray(boardNames)) return '';

    const uniqueBoardNames = [...new Set(
        boardNames
            .map(boardName => String(boardName || '').trim())
            .filter(Boolean),
    )];

    if (!uniqueBoardNames.length) return 'id = ""';

    return uniqueBoardNames
        .map(boardName => `board_name = ${JSON.stringify(boardName)}`)
        .join(' || ');
}

async function parseOrThrow(response) {
    const result = await parsePocketBaseResponse(response);

    if (!response.ok) {
        throw new Error(getPocketBaseErrorMessage(response, result));
    }

    return result;
}

async function parsePocketBaseResponse(response) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

function getPocketBaseErrorMessage(response, result) {
    const fieldErrors = getPocketBaseFieldErrors(result);

    if (result?.message) {
        return `PocketBase ${response.status}: ${result.message}${fieldErrors ? ` ${fieldErrors}` : ''}`;
    }

    return `PocketBase request failed with status ${response.status}.`;
}

function getPocketBaseFieldErrors(result) {
    if (!result?.data || typeof result.data !== 'object') return '';

    const errors = Object.entries(result.data)
        .map(([field, detail]) => {
            const message = detail?.message || detail?.code || JSON.stringify(detail);
            return `${field}: ${message}`;
        })
        .filter(Boolean);

    return errors.length ? `(${errors.join('; ')})` : '';
}

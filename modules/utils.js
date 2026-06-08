import { TASK_STATUSES } from './config.js';

export function escapeHtml(text) {
    const value = String(text ?? '');
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return value.replace(/[&<>"']/g, match => map[match]);
}

export function getUserDisplayName(user) {
    if (!user) return 'Life@Perch User';
    return user.name || user.email || user.id || 'Life@Perch User';
}

export function getUserInitials(name) {
    const parts = String(name || 'User').trim().split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map(part => part[0]).join('');
    return initials.toUpperCase() || 'U';
}

export function getUserType(user) {
    if (!user) return '';

    const value = user['User Type']
        || user.User_Type
        || user.user_type
        || user.userType
        || user.UserType
        || user.role
        || user.type
        || '';

    return String(value).trim();
}

export function isAdminUser(user) {
    return getUserType(user).toLowerCase() === 'admin';
}

export function getUserOrgId(user) {
    if (!user) return '';

    const value = user.org_id
        || user.orgId
        || user.Org_ID
        || user.OrgId
        || user['Org ID']
        || user.organisation
        || user.organization
        || user.org
        || '';

    return String(value).trim();
}

export function getUserBoardName(user) {
    return normalizeOrgBoardName(getUserOrgId(user));
}

export function normalizeOrgBoardName(value) {
    const normalized = String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const boardNames = {
        perch: 'PerchGroup',
        perchgroup: 'PerchGroup',
        aci: 'ACI',
        tml: 'TML',
        connect: 'Connect',
        verify: 'Verify',
    };
    return boardNames[normalized] || String(value || '').trim();
}

export function formatBoolean(value) {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    return 'Not available';
}

export function formatDateTime(value) {
    if (!value) return 'Not available';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

export function normalizeAssignmentValue(value) {
    if (Array.isArray(value)) {
        return String(value[0] || '').trim();
    }

    if (value && typeof value === 'object') {
        return String(value.id || value.name || value.email || '').trim();
    }

    return String(value || '').trim();
}

export function parseTaskJson(value) {
    if (!value) return {};
    if (typeof value === 'object') return value;

    try {
        return JSON.parse(value);
    } catch {
        return {};
    }
}

export function normalizeTaskStatus(value) {
    const normalized = String(value || 'new').toLowerCase().replace(/[\s_-]+/g, '');
    const match = {
        new: 'new',
        todo: 'todo',
        to: 'todo',
        blocked: 'blocked',
        block: 'blocked',
        hold: 'hold',
        held: 'hold',
        completed: 'completed',
        complete: 'completed',
        compleated: 'completed',
        done: 'completed',
    };
    return match[normalized] || 'new';
}

export function getTaskStatusLabel(statusId) {
    return TASK_STATUSES.find(status => status.id === statusId)?.label || 'New';
}

export function toDateTimeLocalValue(value) {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 16);
}

export function createTaskNameFromText(text) {
    const cleaned = text
        .replace(/\s+/g, ' ')
        .replace(/^(please\s+)?(can you\s+)?(raise|create|make|add)\s+(a\s+)?task\s+(to|for)?\s*/i, '')
        .trim();

    if (!cleaned) return 'Task raised from chat';

    const firstSentence = cleaned.split(/[.!?]/)[0].trim();
    return firstSentence.slice(0, 80) || 'Task raised from chat';
}

export function appendFormDataValue(formData, key, value) {
    if (Array.isArray(value)) {
        value.filter(Boolean).forEach(item => formData.append(key, item));
        return;
    }

    if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
    }
}

export async function copyTextToClipboard(text) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand('copy');
    } finally {
        document.body.removeChild(textarea);
    }
}

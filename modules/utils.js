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
    if (!user) return 'Command User';
    return user.name || user.email || user.id || 'Command User';
}

export function getUserInitials(name) {
    const parts = String(name || 'User').trim().split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map(part => part[0]).join('');
    return initials.toUpperCase() || 'U';
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

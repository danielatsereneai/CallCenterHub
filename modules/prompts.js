import {
    EMAIL_RESPONSE_PROMPT,
    FEEDBACK_COACHING_PROMPT,
    TASK_API_REQUEST_PROMPT,
} from './config.js';

const PROMPT_STORAGE_KEY = 'lifeAtPerchCustomPrompts';

const DEFAULT_PROMPTS = [
    TASK_API_REQUEST_PROMPT,
    EMAIL_RESPONSE_PROMPT,
    FEEDBACK_COACHING_PROMPT,
];

export function getPromptLibraryItems() {
    const customPrompts = readCustomPrompts();
    return DEFAULT_PROMPTS.map(promptItem => {
        const customPrompt = String(customPrompts[promptItem.id] || '').trim();
        return {
            ...promptItem,
            prompt: customPrompt || promptItem.prompt,
            defaultPrompt: promptItem.prompt,
            isCustomized: Boolean(customPrompt),
        };
    });
}

export function getPromptText(promptId) {
    const promptItem = getPromptLibraryItems().find(item => item.id === promptId);
    return promptItem?.prompt || '';
}

export function savePromptText(promptId, promptText) {
    const cleanPromptText = String(promptText || '').trim();
    if (!cleanPromptText) {
        throw new Error('Prompt text cannot be empty.');
    }

    const promptItem = DEFAULT_PROMPTS.find(item => item.id === promptId);
    if (!promptItem) {
        throw new Error('Unknown prompt.');
    }

    const customPrompts = readCustomPrompts();
    customPrompts[promptId] = cleanPromptText;
    writeCustomPrompts(customPrompts);
    return getPromptLibraryItems().find(item => item.id === promptId);
}

export function resetPromptText(promptId) {
    const customPrompts = readCustomPrompts();
    delete customPrompts[promptId];
    writeCustomPrompts(customPrompts);
    return getPromptLibraryItems().find(item => item.id === promptId);
}

function readCustomPrompts() {
    if (typeof window === 'undefined' || !window.localStorage) return {};

    try {
        const parsed = JSON.parse(window.localStorage.getItem(PROMPT_STORAGE_KEY) || '{}');
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

function writeCustomPrompts(customPrompts) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(customPrompts));
}

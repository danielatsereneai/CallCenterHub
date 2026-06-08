import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createChatController } from '../modules/chat.js';

function createDom() {
    return {
        connectionStatus: {
            textContent: '',
            classList: {
                add() {},
                remove() {},
            },
        },
        messageInput: { value: '', focus() {} },
        modelSelect: { innerHTML: '', value: '' },
        sendButton: { disabled: false },
        speakButton: {
            disabled: false,
            title: '',
            textContent: '',
            classList: { toggle() {} },
            setAttribute() {},
        },
    };
}

function createUi() {
    return {
        addSystemMessage() {},
        addUserMessage() {},
        addAIMessage() {},
        updateConnectionStatus() {},
    };
}

test('AI requests retry once after a retryable gateway error', async () => {
    const originalFetch = globalThis.fetch;
    const originalWindow = globalThis.window;
    const originalConsoleError = console.error;
    let attempts = 0;

    globalThis.window = {
        setTimeout: (callback, delay) => {
            if (delay < 60000) callback();
            return 1;
        },
        clearTimeout() {},
    };
    globalThis.fetch = async url => {
        if (String(url).endsWith('/api/tags')) {
            return { ok: true, json: async () => ({ models: [] }) };
        }

        attempts += 1;
        if (attempts === 1) {
            return { ok: false, status: 500, json: async () => ({}) };
        }
        return { ok: true, json: async () => ({ message: { content: ' Draft response ' } }) };
    };
    console.error = () => {};

    try {
        const chat = createChatController({
            dom: createDom(),
            ui: createUi(),
            getSelectedBoardName: () => 'PerchGroup',
            openTaskModalWithDraft() {},
            baseUrl: 'https://example.test',
        });
        await chat.checkOllamaConnection();

        const response = await chat.createEmailResponseDraft({
            customerResponse: 'Hello',
            summaryFindings: 'Summary',
        });

        assert.equal(response, 'Draft response');
        assert.equal(attempts, 2);
    } finally {
        globalThis.fetch = originalFetch;
        globalThis.window = originalWindow;
        console.error = originalConsoleError;
    }
});

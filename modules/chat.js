import {
    AVAILABLE_MODELS,
    DEFAULT_OLLAMA_MODEL,
    LIFE_AT_PERCH_AREAS,
    OLLAMA_BASE_URL,
    POCKETBASE_COLLECTION,
    TASK_API_REQUEST_PROMPT,
    TASK_STATUSES,
} from './config.js';
import { createTaskNameFromText, normalizeTaskStatus } from './utils.js';

const TASK_API_REQUEST_URL = `/api/collections/${POCKETBASE_COLLECTION}/records`;

export function createChatController({
    dom,
    ui,
    getSelectedBoardName,
    openTaskModalWithDraft,
    baseUrl = OLLAMA_BASE_URL,
    defaultModel = DEFAULT_OLLAMA_MODEL,
    availableModels = AVAILABLE_MODELS,
}) {
    let isConnected = false;
    let isWaitingForResponse = false;
    let selectedModel = defaultModel;
    let chatTurns = [];
    let speechRecognition = null;
    let isDictating = false;
    let dictationBaseText = '';

    function populateModelSelect() {
        dom.modelSelect.innerHTML = availableModels.map(model => (
            `<option value="${model}"${model === selectedModel ? ' selected' : ''}>${model}</option>`
        )).join('');
    }

    function handleModelChange() {
        selectedModel = dom.modelSelect.value || defaultModel;
        ui.addSystemMessage(`Active model changed to "${selectedModel}".`);
    }

    async function checkOllamaConnection() {
        try {
            const response = await fetch(`${baseUrl}/api/tags`);
            if (response.ok) {
                isConnected = true;
                ui.updateConnectionStatus(true);
                ui.addSystemMessage(`Connected to Ollama. Model "${selectedModel}" ready.`);
            } else {
                setDisconnected('Failed to connect to Ollama. Make sure it is running.');
            }
        } catch (error) {
            console.error('Connection error:', error);
            setDisconnected('Could not connect to Ollama. Please start Ollama before using this app.');
        }
    }

    function setDisconnected(message) {
        isConnected = false;
        ui.updateConnectionStatus(false);
        ui.addSystemMessage(message);
        updateSendButtonState();
    }

    function initializeSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            dom.speakButton.disabled = true;
            dom.speakButton.title = 'Speech recognition is not supported in this browser.';
            dom.speakButton.setAttribute('aria-label', 'Speech recognition unavailable');
            return;
        }

        speechRecognition = new SpeechRecognition();
        speechRecognition.continuous = false;
        speechRecognition.interimResults = true;
        speechRecognition.lang = navigator.language || 'en-GB';
        dom.speakButton.disabled = false;

        let finalTranscript = '';

        speechRecognition.onstart = () => {
            finalTranscript = '';
            dictationBaseText = dom.messageInput.value.trim();
            isDictating = true;
            updateDictationButton();
        };

        speechRecognition.onresult = event => {
            let interimTranscript = '';

            for (let index = event.resultIndex; index < event.results.length; index += 1) {
                const transcript = event.results[index][0]?.transcript || '';

                if (event.results[index].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            const dictatedText = `${finalTranscript}${interimTranscript}`.trim();
            if (dictatedText) {
                dom.messageInput.value = mergeDictationText(dictationBaseText, dictatedText);
            }
        };

        speechRecognition.onerror = event => {
            ui.addSystemMessage(`Dictation stopped: ${event.error || 'speech recognition error'}.`);
        };

        speechRecognition.onend = () => {
            isDictating = false;
            updateDictationButton();
            dom.messageInput.focus();
        };

        updateDictationButton();
    }

    function toggleDictation() {
        if (!speechRecognition) {
            ui.addSystemMessage('Speech recognition is not supported in this browser.');
            return;
        }

        if (isDictating) {
            speechRecognition.stop();
            return;
        }

        try {
            speechRecognition.start();
        } catch (error) {
            ui.addSystemMessage(`Could not start dictation: ${error.message}`);
        }
    }

    function updateDictationButton() {
        dom.speakButton.classList.toggle('listening', isDictating);
        dom.speakButton.textContent = isDictating ? '■' : '🎙';
        dom.speakButton.title = isDictating ? 'Stop dictation' : 'Dictate message';
        dom.speakButton.setAttribute('aria-label', isDictating ? 'Stop dictation' : 'Dictate message');
    }

    function mergeDictationText(currentText, dictatedText) {
        const cleanText = dictatedText.trim();
        if (!currentText.trim()) return cleanText;

        return `${currentText.replace(/\s+$/, '')} ${cleanText}`;
    }

    async function sendMessage() {
        const message = dom.messageInput.value.trim();

        if (!message) return;

        if (!isConnected) {
            ui.addSystemMessage('Not connected to Ollama. Please check your connection.');
            return;
        }

        if (isWaitingForResponse) {
            ui.addSystemMessage('Still waiting for a response. Please wait...');
            return;
        }

        ui.addUserMessage(message);
        chatTurns.push({ role: 'user', content: message });
        dom.messageInput.value = '';
        dom.messageInput.focus();

        isWaitingForResponse = true;
        updateSendButtonState();
        ui.updateConnectionStatus(true);

        try {
            const response = await queryOllama(message);
            const turnIndex = chatTurns.push({ role: 'assistant', content: response }) - 1;
            ui.addAIMessage(response, turnIndex);
        } catch (error) {
            console.error('Error:', error);
            ui.addSystemMessage(`Error: ${error.message}`);
            isConnected = false;
            ui.updateConnectionStatus(false);
        } finally {
            isWaitingForResponse = false;
            updateSendButtonState();
        }
    }

    async function queryOllama(prompt) {
        dom.connectionStatus.textContent = 'Thinking...';
        dom.connectionStatus.classList.add('loading');
        dom.connectionStatus.classList.remove('ready');

        try {
            const response = await fetch(`${baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: [
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                    stream: false,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.message && data.message.content) {
                return data.message.content.trim();
            }

            throw new Error('No response from model');
        } catch (error) {
            console.error('Ollama query error:', error);
            throw error;
        } finally {
            dom.connectionStatus.textContent = 'Ready';
            dom.connectionStatus.classList.remove('loading');
            dom.connectionStatus.classList.add('ready');
        }
    }

    async function handleChatActionClick(event) {
        const raiseTaskButton = event.target.closest('.raise-task-button');
        if (!raiseTaskButton) return;

        const turnIndex = Number(raiseTaskButton.dataset.turnIndex);
        raiseTaskButton.disabled = true;
        raiseTaskButton.textContent = 'Preparing Task...';

        try {
            const taskDraft = await formatTaskDraftWithPrompt(turnIndex);
            openTaskModalWithDraft(taskDraft);
        } catch (error) {
            console.error('Task API formatter error:', error);
            ui.addSystemMessage('Task API request could not be structured, so a basic draft was created.', 'error');
            openTaskModalWithDraft(buildFallbackTaskDraft(turnIndex, error.message));
        } finally {
            raiseTaskButton.disabled = false;
            raiseTaskButton.textContent = 'Raise Task';
        }
    }

    async function formatTaskDraftWithPrompt(turnIndex) {
        const context = getTaskFormattingContext(turnIndex);
        const formatterResponse = await queryOllama(buildTaskFormattingPrompt(context));
        const parsedResponse = parseTaskFormatterResponse(formatterResponse);
        return buildTaskDraftFromApiRequest(parsedResponse, context, formatterResponse);
    }

    function getTaskFormattingContext(turnIndex) {
        const assistantTurn = chatTurns[turnIndex] || {};
        const userTurn = findPreviousUserTurn(turnIndex);
        const userMessage = userTurn?.content || '';
        const assistantMessage = assistantTurn.content || '';
        const boardName = getSelectedBoardName();
        const chatHistory = chatTurns.slice(0, turnIndex + 1).map(turn => ({
            role: turn.role,
            content: turn.content,
        }));

        return {
            assistantMessage,
            boardName,
            chatHistory,
            turnIndex,
            userMessage,
        };
    }

    function buildTaskFormattingPrompt(context) {
        const promptInput = {
            selected_board_name: context.boardName,
            allowed_categories: getAllowedCategoryLabels(),
            allowed_statuses: TASK_STATUSES.map(status => status.id),
            api_request_url: TASK_API_REQUEST_URL,
            user_message: context.userMessage,
            agent_response: context.assistantMessage,
        };

        return `${TASK_API_REQUEST_PROMPT.prompt}

Format this task request:
${JSON.stringify(promptInput, null, 2)}`;
    }

    function parseTaskFormatterResponse(text) {
        const jsonText = extractJsonText(text);
        const parsed = JSON.parse(jsonText);

        if (!parsed?.api_request?.body || typeof parsed.api_request.body !== 'object') {
            throw new Error('Missing api_request.body');
        }

        return parsed;
    }

    function extractJsonText(text) {
        const value = String(text || '').trim();
        const fencedMatch = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fencedMatch) return fencedMatch[1].trim();

        const firstBrace = value.indexOf('{');
        const lastBrace = value.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return value.slice(firstBrace, lastBrace + 1);
        }

        return value;
    }

    function buildTaskDraftFromApiRequest(formatterResult, context, rawFormatterResponse) {
        const body = formatterResult.api_request.body;
        const category = normalizeCategory(formatterResult.category || body.board_name || context.boardName);
        const boardName = normalizeCategory(body.board_name || category || context.boardName);
        const taskStatus = normalizeTaskStatus(body.task_status || 'new');
        const taskName = String(body.task_name || createTaskNameFromText(context.userMessage || context.assistantMessage)).slice(0, 80);
        const summary = String(formatterResult.summary || body.Json?.summary || '').trim();
        const questions = Array.isArray(body.Json?.questions) ? body.Json.questions.filter(Boolean) : [];
        const notes = String(body.Notes || '').trim();
        const taskId = Number(body.task_id) || Date.now();
        const jsonValue = {
            ...(body.Json && typeof body.Json === 'object' ? body.Json : {}),
            source: 'Life@Perch task API prompt',
            category,
            summary,
            questions,
            status: taskStatus,
            board_name: boardName,
            formatted_at: new Date().toISOString(),
            model: selectedModel,
            user_message: context.userMessage,
            agent_response: context.assistantMessage,
            raw_formatter_response: rawFormatterResponse,
        };
        const apiRequestPreview = {
            method: 'POST',
            url: TASK_API_REQUEST_URL,
            body: {
                ...body,
                Json: jsonValue,
                task_id: taskId,
                task_status: taskStatus,
                board_name: boardName,
            },
        };

        return {
            task_name: taskName || 'Task raised from chat',
            task_description: body.task_description || context.userMessage || 'Task raised from agent chat.',
            Notes: [
                notes || (summary ? `Summary: ${summary}` : ''),
                `Generated API request:\n${JSON.stringify(apiRequestPreview, null, 2)}`,
                questions.length ? `Questions:\n${questions.map(question => `- ${question}`).join('\n')}` : '',
            ].filter(Boolean).join('\n\n') || [
                summary ? `Summary: ${summary}` : '',
                `Agent response:\n${context.assistantMessage}`,
            ].filter(Boolean).join('\n\n'),
            Json: {
                ...jsonValue,
                generated_api_request: apiRequestPreview,
            },
            assigned: '',
            board_name: boardName,
            task_status: taskStatus,
            task_id: taskId,
        };
    }

    function buildFallbackTaskDraft(turnIndex, reason = '') {
        const context = getTaskFormattingContext(turnIndex);
        const taskName = createTaskNameFromText(context.userMessage || context.assistantMessage);

        return {
            task_name: taskName,
            task_description: context.userMessage || 'Task raised from agent chat.',
            Notes: [
                reason ? `Task API formatter fallback: ${reason}` : 'Task API formatter fallback used.',
                `Agent response:\n${context.assistantMessage}`,
            ].join('\n\n'),
            Json: {
                source: 'Life@Perch chat fallback',
                model: selectedModel,
                status: 'new',
                board_name: context.boardName,
                raised_at: new Date().toISOString(),
                user_message: context.userMessage,
                agent_response: context.assistantMessage,
                chat_history: context.chatHistory,
            },
            assigned: '',
            board_name: context.boardName,
            task_status: 'new',
            task_id: Date.now(),
        };
    }

    function normalizeCategory(value) {
        const allowedLabels = getAllowedCategoryLabels();
        const normalizedValue = String(value || '').trim().toLowerCase();
        const matchingLabel = allowedLabels.find(label => label.toLowerCase() === normalizedValue);
        return matchingLabel || (allowedLabels.includes(getSelectedBoardName()) ? getSelectedBoardName() : 'PerchGroup');
    }

    function getAllowedCategoryLabels() {
        return LIFE_AT_PERCH_AREAS.map(area => area.label);
    }

    function findPreviousUserTurn(startIndex) {
        for (let index = startIndex - 1; index >= 0; index -= 1) {
            if (chatTurns[index]?.role === 'user') {
                return chatTurns[index];
            }
        }

        return null;
    }

    function updateSendButtonState() {
        dom.sendButton.disabled = isWaitingForResponse || !isConnected;
    }

    return {
        populateModelSelect,
        handleModelChange,
        checkOllamaConnection,
        initializeSpeechRecognition,
        toggleDictation,
        sendMessage,
        handleChatActionClick,
    };
}

import {
    AVAILABLE_MODELS,
    DEFAULT_OLLAMA_MODEL,
    OLLAMA_BASE_URL,
} from './config.js';
import { createTaskNameFromText } from './utils.js';

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

    function handleChatActionClick(event) {
        const raiseTaskButton = event.target.closest('.raise-task-button');
        if (!raiseTaskButton) return;

        const turnIndex = Number(raiseTaskButton.dataset.turnIndex);
        const taskDraft = buildTaskDraftFromChat(turnIndex);
        openTaskModalWithDraft(taskDraft);
    }

    function buildTaskDraftFromChat(turnIndex) {
        const assistantTurn = chatTurns[turnIndex] || {};
        const userTurn = findPreviousUserTurn(turnIndex);
        const userMessage = userTurn?.content || '';
        const assistantMessage = assistantTurn.content || '';
        const taskName = createTaskNameFromText(userMessage || assistantMessage);
        const boardName = getSelectedBoardName();
        const chatHistory = chatTurns.slice(0, turnIndex + 1).map(turn => ({
            role: turn.role,
            content: turn.content,
        }));

        return {
            task_name: taskName,
            task_description: userMessage || 'Task raised from agent chat.',
            Notes: `Agent response:\n${assistantMessage}`,
            Json: {
                source: 'Base Start chat',
                model: selectedModel,
                status: 'new',
                board_name: boardName,
                raised_at: new Date().toISOString(),
                user_message: userMessage,
                agent_response: assistantMessage,
                chat_history: chatHistory,
            },
            assigned: '',
            board_name: boardName,
            task_id: Date.now(),
        };
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

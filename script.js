import {
    DEFAULT_QUICK_LINK_FILTER,
    POCKETBASE_AUTH_STORAGE_KEY,
    POCKETBASE_TOKEN_STORAGE_KEY,
} from './modules/config.js';
import { createSessionStore } from './modules/auth.js';
import { createChatController } from './modules/chat.js';
import { createPocketBaseClient } from './modules/pocketbaseClient.js';
import { createTaskController } from './modules/tasks.js';
import { collectDom, createUi } from './modules/ui.js';
import { getUserDisplayName } from './modules/utils.js';

const dom = collectDom();
const ui = createUi(dom);
const session = createSessionStore({
    authStorageKey: POCKETBASE_AUTH_STORAGE_KEY,
    tokenStorageKey: POCKETBASE_TOKEN_STORAGE_KEY,
});
const pocketbase = createPocketBaseClient();

let currentUser = null;
let currentUserToken = '';

const tasks = createTaskController({
    dom,
    ui,
    pocketbase,
    session,
    getCurrentUser: () => currentUser,
    getCurrentUserToken: () => currentUserToken,
    onSystemMessage: message => ui.addSystemMessage(message),
});

const chat = createChatController({
    dom,
    ui,
    getSelectedBoardName: () => tasks.getSelectedBoardName(),
    openTaskModalWithDraft: taskDraft => tasks.openTaskModalWithDraft(taskDraft),
});

document.addEventListener('DOMContentLoaded', () => {
    chat.populateModelSelect();
    ui.renderPromptLibrary();
    ui.updateDateTimeDisplay();
    setInterval(ui.updateDateTimeDisplay, 30000);
    tasks.hydratePocketBaseTokenInputs();
    hydrateAuthSession();

    bindEvents();

    if (currentUser) {
        startAuthenticatedApp();
    } else {
        ui.showAuthScreen();
    }

    ui.setQuickLinkFilter(DEFAULT_QUICK_LINK_FILTER);
});

function bindEvents() {
    dom.loginForm.addEventListener('submit', loginCommandUser);
    dom.closeAnnouncementButton.addEventListener('click', ui.hideAnnouncement);
    dom.mySettingsButton.addEventListener('click', openSettingsModal);
    dom.logoutButton.addEventListener('click', logoutCommandUser);
    dom.closeSettingsModalButton.addEventListener('click', ui.closeSettingsModal);
    dom.closeSettingsButton.addEventListener('click', ui.closeSettingsModal);
    dom.settingsModal.addEventListener('click', handleSettingsModalBackdropClick);

    chat.initializeSpeechRecognition();
    dom.speakButton.addEventListener('click', chat.toggleDictation);
    dom.sendButton.addEventListener('click', chat.sendMessage);
    dom.modelSelect.addEventListener('change', chat.handleModelChange);
    dom.chatMessages.addEventListener('click', chat.handleChatActionClick);
    dom.agentChatToggle.addEventListener('click', ui.toggleAgentChat);
    dom.closeAgentChatButton.addEventListener('click', ui.closeAgentChat);

    dom.newTaskTile.addEventListener('click', tasks.openTaskModal);
    dom.newTaskTile.addEventListener('keydown', tasks.handleTaskTileKeydown);
    dom.closeTaskModalButton.addEventListener('click', tasks.closeTaskModal);
    dom.cancelTaskButton.addEventListener('click', tasks.closeTaskModal);
    dom.refreshTasksButton.addEventListener('click', tasks.refreshPocketBaseData);
    dom.refreshBoardButton.addEventListener('click', tasks.refreshPocketBaseData);
    dom.newBoardTaskButton.addEventListener('click', tasks.openBoardTaskModal);
    dom.boardSelect.addEventListener('change', tasks.renderKanbanBoard);
    dom.taskPanelTokenInput.addEventListener('change', tasks.syncPocketBaseTokenFromPanel);
    if (dom.pocketbaseTokenInput) {
        dom.pocketbaseTokenInput.addEventListener('change', tasks.syncPocketBaseTokenFromModal);
    }
    dom.taskModal.addEventListener('click', tasks.handleTaskModalBackdropClick);
    dom.taskForm.addEventListener('submit', tasks.saveTask);
    dom.generateAiTaskButton.addEventListener('click', generateAiTaskDraft);
    dom.addTaskCommentButton.addEventListener('click', tasks.addTaskComment);
    dom.taskList.addEventListener('click', tasks.handleTaskListClick);
    dom.taskList.addEventListener('keydown', tasks.handleTaskListKeydown);
    dom.kanbanBoard.addEventListener('click', tasks.handleKanbanClick);
    dom.kanbanBoard.addEventListener('keydown', tasks.handleKanbanKeydown);
    dom.kanbanBoard.addEventListener('dragstart', tasks.handleKanbanDragStart);
    dom.kanbanBoard.addEventListener('dragover', tasks.handleKanbanDragOver);
    dom.kanbanBoard.addEventListener('dragleave', tasks.handleKanbanDragLeave);
    dom.kanbanBoard.addEventListener('drop', tasks.handleKanbanDrop);
    dom.kanbanBoard.addEventListener('dragend', tasks.handleKanbanDragEnd);

    dom.navItems.forEach(item => {
        item.addEventListener('click', handleNavClick);
    });
    dom.quickLinkFilterButtons.forEach(button => {
        button.addEventListener('click', handleQuickLinkFilterClick);
    });
    dom.messageInput.addEventListener('keypress', event => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            chat.sendMessage();
        }
    });
    document.addEventListener('keydown', handleGlobalKeydown);
}

function hydrateAuthSession() {
    const authData = session.hydrateAuthSession();
    currentUser = authData.record;
    currentUserToken = authData.token;
}

function persistAuthSession(authData) {
    currentUser = authData.record;
    currentUserToken = authData.token;
    session.persistAuthSession(authData);
}

function clearAuthSession() {
    currentUser = null;
    currentUserToken = '';
    session.clearAuthSession();
}

async function startAuthenticatedApp() {
    ui.showAppScreen(currentUser);
    tasks.populateAssignedSelect();
    chat.checkOllamaConnection();
    await tasks.refreshPocketBaseData();
}

async function loginCommandUser(event) {
    event.preventDefault();
    ui.setAuthStatus('Logging in...');
    dom.loginButton.disabled = true;

    try {
        const authData = await pocketbase.authenticateCommandUser(
            dom.loginEmailInput.value.trim(),
            dom.loginPasswordInput.value,
        );
        persistAuthSession(authData);
        dom.loginPasswordInput.value = '';
        ui.setAuthStatus('Logged in.', 'success');
        ui.addSystemMessage(`Logged in as ${getUserDisplayName(currentUser)}.`, 'success');
        await startAuthenticatedApp();
    } catch (error) {
        console.error('PocketBase login error:', error);
        ui.setAuthStatus(error.message, 'error');
    } finally {
        dom.loginButton.disabled = false;
    }
}

function logoutCommandUser() {
    ui.closeSettingsModal();
    clearAuthSession();
    tasks.clearTaskState();
    ui.showAuthScreen();
    ui.setAuthStatus('Logged out.');
}

async function openSettingsModal() {
    if (!currentUser) {
        ui.addSystemMessage('Settings unavailable because no user is logged in.');
        return;
    }

    ui.renderUserSettings(currentUser);
    ui.openSettingsModal();

    try {
        const profile = await pocketbase.fetchCurrentUserProfile(currentUser.id, currentUserToken);
        if (profile?.token) {
            currentUserToken = profile.token;
        }
        const profileRecord = profile?.record || profile;
        if (profileRecord?.id) {
            currentUser = {
                ...currentUser,
                ...profileRecord,
            };
            persistAuthSession({
                token: currentUserToken,
                record: currentUser,
            });
            ui.updateCurrentUserDisplay(currentUser);
            ui.renderUserSettings(currentUser);
        }
    } catch (error) {
        console.error('PocketBase profile load error:', error);
        ui.renderUserSettings(currentUser, `Profile refresh failed: ${error.message}`);
    }
}

function handleSettingsModalBackdropClick(event) {
    if (event.target === dom.settingsModal) {
        ui.closeSettingsModal();
    }
}

function handleNavClick(event) {
    event.preventDefault();
    const view = event.currentTarget.dataset.view;
    ui.showView(view, tasks.renderKanbanBoard);
}

function handleQuickLinkFilterClick(event) {
    ui.setQuickLinkFilter(event.currentTarget.dataset.quickLinkFilter);
}

async function generateAiTaskDraft() {
    const prompt = dom.aiTaskPromptInput.value.trim();
    const preSummary = dom.aiTaskSummaryInput.value.trim();

    if (!prompt && !preSummary) {
        ui.setTaskFormStatus('Add a prompt or pre-summary before creating an AI task draft.', 'error');
        dom.aiTaskPromptInput.focus();
        return;
    }

    dom.generateAiTaskButton.disabled = true;
    dom.generateAiTaskButton.textContent = 'Creating...';
    ui.setTaskFormStatus('Creating task draft with AI...');

    try {
        const taskDraft = await chat.createTaskDraftFromInput({
            prompt,
            preSummary,
            boardName: document.getElementById('taskBoardName').value.trim() || tasks.getSelectedBoardName(),
        });
        tasks.openTaskModalWithDraft(taskDraft);
        ui.setTaskFormStatus('Review the AI-created task API request, then save it to PocketBase.', 'success');
    } catch (error) {
        console.error('AI task draft error:', error);
        ui.setTaskFormStatus(error.message, 'error');
        ui.addSystemMessage(`AI task draft failed: ${error.message}`, 'error');
    } finally {
        dom.generateAiTaskButton.disabled = false;
        dom.generateAiTaskButton.textContent = 'Create with AI';
    }
}

function handleGlobalKeydown(event) {
    if (event.key === 'Escape' && document.body.classList.contains('agent-chat-open')) {
        ui.closeAgentChat();
    }
}

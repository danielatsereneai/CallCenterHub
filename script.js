import {
    DEFAULT_QUICK_LINK_FILTER,
    POCKETBASE_AUTH_STORAGE_KEY,
} from './modules/config.js';
import { createSessionStore } from './modules/auth.js';
import { createChatController } from './modules/chat.js';
import { createFeedbackController } from './modules/feedback.js';
import { createPocketBaseClient } from './modules/pocketbaseClient.js';
import { createTaskController } from './modules/tasks.js';
import { collectDom, createUi } from './modules/ui.js';
import { copyTextToClipboard, getUserDisplayName, isAdminUser } from './modules/utils.js';

const dom = collectDom();
const ui = createUi(dom);
const session = createSessionStore({
    authStorageKey: POCKETBASE_AUTH_STORAGE_KEY,
});
const pocketbase = createPocketBaseClient();

let currentUser = null;
let currentUserToken = '';

const tasks = createTaskController({
    dom,
    ui,
    pocketbase,
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

const feedback = createFeedbackController({
    dom,
    ui,
    chat,
    tasks,
    getCurrentUser: () => currentUser,
    onSystemMessage: (message, type) => ui.addSystemMessage(message, type),
});

document.addEventListener('DOMContentLoaded', () => {
    chat.populateModelSelect();
    hydrateAuthSession();
    syncPromptEditPermission();
    ui.updateDateTimeDisplay();
    setInterval(ui.updateDateTimeDisplay, 30000);
    ui.renderOperationsTeams();
    ui.renderPinnedTeamNav();

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
    if (dom.promptLibrary) {
        dom.promptLibrary.addEventListener('click', ui.handlePromptLibraryClick);
    }
    if (dom.knowledgeTabs) {
        dom.knowledgeTabs.addEventListener('click', ui.handleKnowledgeTabsClick);
    }
    if (dom.feedbackKnowledgeList) {
        dom.feedbackKnowledgeList.addEventListener('click', feedback.handleKnowledgeFeedbackClick);
    }
    if (dom.operationsTeamGrid) {
        dom.operationsTeamGrid.addEventListener('click', ui.handleOperationsClick);
    }
    if (dom.teamDashboardPage) {
        dom.teamDashboardPage.addEventListener('click', ui.handleTeamDashboardClick);
    }

    dom.newTaskTile.addEventListener('click', tasks.openTaskModal);
    dom.newTaskTile.addEventListener('keydown', tasks.handleTaskTileKeydown);
    dom.feedbackSubmissionsTile.addEventListener('click', feedback.openFeedbackModal);
    dom.feedbackSubmissionsTile.addEventListener('keydown', feedback.handleFeedbackTileKeydown);
    window.addEventListener('open-feedback-submissions', feedback.openFeedbackModal);
    dom.closeFeedbackModalButton.addEventListener('click', feedback.closeFeedbackModal);
    dom.cancelFeedbackButton.addEventListener('click', feedback.closeFeedbackModal);
    dom.clearFeedbackButton.addEventListener('click', feedback.clearFeedbackForm);
    dom.feedbackModal.addEventListener('click', feedback.handleFeedbackModalBackdropClick);
    dom.rewriteFeedbackButton.addEventListener('click', feedback.rewriteFeedback);
    dom.feedbackForm.addEventListener('submit', feedback.saveFeedback);
    dom.closeTaskModalButton.addEventListener('click', tasks.closeTaskModal);
    dom.cancelTaskButton.addEventListener('click', tasks.closeTaskModal);
    dom.closeEmailResponseModalButton.addEventListener('click', ui.closeEmailResponseModal);
    dom.clearEmailResponseButton.addEventListener('click', ui.clearEmailResponseForm);
    dom.copyEmailResponseButton.addEventListener('click', copyEmailResponseDraft);
    dom.generateEmailResponseButton.addEventListener('click', generateEmailResponseDraft);
    dom.emailResponseModal.addEventListener('click', handleEmailResponseModalBackdropClick);
    dom.refreshBoardButton.addEventListener('click', tasks.refreshPocketBaseData);
    dom.newBoardTaskButton.addEventListener('click', tasks.openBoardTaskModal);
    dom.boardSelect.addEventListener('change', tasks.renderKanbanBoard);
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

    dom.mainNavList.addEventListener('click', handleNavClick);
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
    syncPromptEditPermission();
}

function clearAuthSession() {
    currentUser = null;
    currentUserToken = '';
    session.clearAuthSession();
    syncPromptEditPermission();
}

async function startAuthenticatedApp() {
    await refreshCurrentUserProfile({ silent: true });
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
    await refreshCurrentUserProfile({ renderSettings: true });
}

async function refreshCurrentUserProfile({ renderSettings = false, silent = false } = {}) {
    if (!currentUser?.id || !currentUserToken) return;

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
            if (renderSettings) {
                ui.renderUserSettings(currentUser);
            }
        }
    } catch (error) {
        console.error('PocketBase profile load error:', error);
        if (renderSettings) {
            ui.renderUserSettings(currentUser, `Profile refresh failed: ${error.message}`);
        }
        if (!silent) {
            ui.addSystemMessage(`Profile refresh failed: ${error.message}`, 'error');
        }
    }
}

function syncPromptEditPermission() {
    ui.setPromptEditPermission(isAdminUser(currentUser));
}

function handleSettingsModalBackdropClick(event) {
    if (event.target === dom.settingsModal) {
        ui.closeSettingsModal();
    }
}

function handleEmailResponseModalBackdropClick(event) {
    if (event.target === dom.emailResponseModal) {
        ui.closeEmailResponseModal();
    }
}

function handleNavClick(event) {
    const navItem = event.target.closest('.nav-item[data-view]');
    if (!navItem) return;

    event.preventDefault();
    const view = navItem.dataset.view;
    if (view === 'team') {
        ui.openTeamDashboard(navItem.dataset.teamId);
        return;
    }

    ui.showView(view, tasks.renderKanbanBoard);
    if (view === 'knowledge') {
        feedback.renderKnowledgeFeedback();
    }
}

function handleQuickLinkFilterClick(event) {
    ui.setQuickLinkFilter(event.currentTarget.dataset.quickLinkFilter);
}

async function generateAiTaskDraft() {
    const preSummary = dom.aiTaskSummaryInput.value.trim();

    if (!preSummary) {
        ui.setTaskFormStatus('Add a pre-summary before creating an AI task draft.', 'error');
        dom.aiTaskSummaryInput.focus();
        return;
    }

    dom.generateAiTaskButton.disabled = true;
    dom.generateAiTaskButton.textContent = 'Creating...';
    ui.setTaskFormStatus('Creating task draft with AI...');

    try {
        const taskDraft = await chat.createTaskDraftFromInput({
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

async function generateEmailResponseDraft() {
    const customerResponse = dom.emailCustomerResponseInput.value.trim();
    const summaryFindings = dom.emailSummaryFindingsInput.value.trim();

    if (!customerResponse || !summaryFindings) {
        ui.setEmailResponseStatus('Add the customer response and your summary findings before generating.', 'error');
        (customerResponse ? dom.emailSummaryFindingsInput : dom.emailCustomerResponseInput).focus();
        return;
    }

    dom.generateEmailResponseButton.disabled = true;
    dom.generateEmailResponseButton.textContent = 'Generating...';
    ui.setEmailResponseStatus('Generating email response...');

    try {
        const response = await chat.createEmailResponseDraft({
            customerResponse,
            summaryFindings,
        });
        ui.setEmailResponseOutput(response);
        ui.setEmailResponseStatus('Response generated. Review before sending.', 'success');
    } catch (error) {
        console.error('AI email response error:', error);
        ui.setEmailResponseStatus(error.message, 'error');
        ui.addSystemMessage(`AI email response failed: ${error.message}`, 'error');
    } finally {
        dom.generateEmailResponseButton.disabled = false;
        dom.generateEmailResponseButton.textContent = 'Generate Response';
    }
}

async function copyEmailResponseDraft() {
    const responseText = dom.emailResponseOutput.textContent.trim();

    if (!responseText || responseText === 'Generated response will appear here.') {
        ui.setEmailResponseStatus('Generate a response before copying.', 'error');
        return;
    }

    try {
        await copyTextToClipboard(responseText);
        ui.setEmailResponseStatus('Generated response copied.', 'success');
    } catch (error) {
        console.error('Copy email response error:', error);
        ui.setEmailResponseStatus('Could not copy the response. Select the text and copy it manually.', 'error');
    }
}

function handleGlobalKeydown(event) {
    if (event.key === 'Escape' && dom.feedbackModal.classList.contains('open')) {
        feedback.closeFeedbackModal();
        return;
    }

    if (event.key === 'Escape' && document.body.classList.contains('agent-chat-open')) {
        ui.closeAgentChat();
    }
}

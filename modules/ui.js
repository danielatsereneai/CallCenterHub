import { DEFAULT_QUICK_LINK_FILTER, TASK_API_REQUEST_PROMPT } from './config.js';
import {
    escapeHtml,
    formatBoolean,
    formatDateTime,
    getUserDisplayName,
    getUserInitials,
} from './utils.js';

export function collectDom() {
    return {
        authScreen: document.getElementById('authScreen'),
        announcementBar: document.getElementById('announcementBar'),
        announcementText: document.getElementById('announcementText'),
        closeAnnouncementButton: document.getElementById('closeAnnouncementButton'),
        loginForm: document.getElementById('loginForm'),
        loginEmailInput: document.getElementById('loginEmail'),
        loginPasswordInput: document.getElementById('loginPassword'),
        loginButton: document.getElementById('loginButton'),
        authStatus: document.getElementById('authStatus'),
        userCard: document.getElementById('userCard'),
        currentUserName: document.getElementById('currentUserName'),
        mySettingsButton: document.getElementById('mySettingsButton'),
        logoutButton: document.getElementById('logoutButton'),
        settingsModal: document.getElementById('settingsModal'),
        closeSettingsModalButton: document.getElementById('closeSettingsModal'),
        closeSettingsButton: document.getElementById('closeSettingsButton'),
        settingsAvatar: document.getElementById('settingsAvatar'),
        settingsProfileName: document.getElementById('settingsProfileName'),
        settingsProfileEmail: document.getElementById('settingsProfileEmail'),
        settingsDetails: document.getElementById('settingsDetails'),
        messageInput: document.getElementById('messageInput'),
        speakButton: document.getElementById('speakButton'),
        sendButton: document.getElementById('sendButton'),
        chatMessages: document.getElementById('chatMessages'),
        statusIndicator: document.querySelector('.status-indicator'),
        statusText: document.getElementById('statusText'),
        dateTimeInfo: document.getElementById('dateTimeInfo'),
        modelSelect: document.getElementById('modelSelect'),
        connectionStatus: document.getElementById('connectionStatus'),
        newTaskTile: document.getElementById('newTaskTile'),
        taskModal: document.getElementById('taskModal'),
        closeTaskModalButton: document.getElementById('closeTaskModal'),
        cancelTaskButton: document.getElementById('cancelTaskButton'),
        taskForm: document.getElementById('taskForm'),
        taskFormStatus: document.getElementById('taskFormStatus'),
        saveTaskButton: document.getElementById('saveTaskButton'),
        aiTaskPromptInput: document.getElementById('aiTaskPrompt'),
        aiTaskSummaryInput: document.getElementById('aiTaskSummary'),
        generateAiTaskButton: document.getElementById('generateAiTaskButton'),
        taskCommentCount: document.getElementById('taskCommentCount'),
        taskCommentList: document.getElementById('taskCommentList'),
        taskCommentInput: document.getElementById('taskCommentInput'),
        addTaskCommentButton: document.getElementById('addTaskCommentButton'),
        taskList: document.getElementById('taskList'),
        taskCount: document.getElementById('taskCount'),
        pocketbaseTokenInput: document.getElementById('pocketbaseToken'),
        taskIdInput: document.getElementById('taskId'),
        taskModalTitle: document.getElementById('taskModalTitle'),
        taskPanelTokenInput: document.getElementById('taskPanelToken'),
        refreshTasksButton: document.getElementById('refreshTasksButton'),
        navItems: document.querySelectorAll('.nav-item[data-view]'),
        homeViewElements: document.querySelectorAll('.home-view'),
        tasksBoardPage: document.getElementById('tasksBoardPage'),
        knowledgePage: document.getElementById('knowledgePage'),
        boardSelect: document.getElementById('boardSelect'),
        refreshBoardButton: document.getElementById('refreshBoardButton'),
        newBoardTaskButton: document.getElementById('newBoardTaskButton'),
        kanbanBoard: document.getElementById('kanbanBoard'),
        taskAssignedSelect: document.getElementById('taskAssigned'),
        quickLinkFilterButtons: document.querySelectorAll('[data-quick-link-filter]'),
        quickLinkCards: document.querySelectorAll('.quick-link-card'),
        agentChatToggle: document.getElementById('agentChatToggle'),
        closeAgentChatButton: document.getElementById('closeAgentChatButton'),
        chatPanel: document.getElementById('chat-panel'),
        promptLibrary: document.getElementById('promptLibrary'),
    };
}

export function createUi(dom) {
    let announcementTimer = null;

    function showAuthScreen() {
        document.body.classList.remove('is-authenticated');
        dom.authScreen.removeAttribute('hidden');
        dom.loginEmailInput.focus();
    }

    function showAppScreen(currentUser) {
        document.body.classList.add('is-authenticated');
        dom.authScreen.setAttribute('hidden', 'true');
        updateCurrentUserDisplay(currentUser);
    }

    function setQuickLinkFilter(filter) {
        const activeFilter = filter || DEFAULT_QUICK_LINK_FILTER;

        dom.quickLinkFilterButtons.forEach(button => {
            const isActive = button.dataset.quickLinkFilter === activeFilter;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });

        dom.quickLinkCards.forEach(card => {
            card.hidden = card.dataset.linkGroup !== activeFilter;
        });
    }

    function showView(view, onTasksView) {
        const isTasksView = view === 'tasks';
        const isKnowledgeView = view === 'knowledge';
        const isHomeView = !isTasksView && !isKnowledgeView;
        dom.homeViewElements.forEach(element => {
            element.hidden = !isHomeView;
        });
        dom.tasksBoardPage.hidden = !isTasksView;
        dom.knowledgePage.hidden = !isKnowledgeView;
        dom.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });

        if (isTasksView && onTasksView) {
            onTasksView();
        }
    }

    function updateCurrentUserDisplay(currentUser) {
        if (!currentUser) {
            dom.userCard.hidden = true;
            return;
        }

        dom.userCard.hidden = false;
        dom.currentUserName.textContent = getUserDisplayName(currentUser);
    }

    function renderUserSettings(user, notice = '') {
        const displayName = getUserDisplayName(user);
        const email = user?.email || 'No email available';
        dom.settingsAvatar.textContent = getUserInitials(displayName);
        dom.settingsProfileName.textContent = displayName;
        dom.settingsProfileEmail.textContent = email;

        const fields = [
            ['Name', user?.name || 'Not set'],
            ['Email', email],
            ['User ID', user?.id || 'Not available'],
            ['Verified', formatBoolean(user?.verified)],
            ['Created', formatDateTime(user?.created)],
            ['Updated', formatDateTime(user?.updated)],
        ];

        dom.settingsDetails.innerHTML = [
            notice ? `<div class="empty-state empty-state-error settings-notice">${escapeHtml(notice)}</div>` : '',
            ...fields.map(([label, value]) => `
        <div class="settings-field">
            <span>${escapeHtml(label)}</span>
            <b>${escapeHtml(value)}</b>
        </div>
    `),
        ].join('');
    }

    function openSettingsModal() {
        dom.settingsModal.classList.add('open');
        dom.settingsModal.setAttribute('aria-hidden', 'false');
    }

    function closeSettingsModal() {
        dom.settingsModal.classList.remove('open');
        dom.settingsModal.setAttribute('aria-hidden', 'true');
    }

    function setAuthStatus(message, type = '') {
        dom.authStatus.textContent = message;
        dom.authStatus.classList.remove('success', 'error');
        if (type) dom.authStatus.classList.add(type);
    }

    function setTaskFormStatus(message, type = '') {
        dom.taskFormStatus.textContent = message;
        dom.taskFormStatus.classList.remove('success', 'error');
        if (type) dom.taskFormStatus.classList.add(type);
    }

    function setTaskListStatus(message, type = '') {
        dom.taskList.innerHTML = `<div class="empty-state ${type ? `empty-state-${type}` : ''}">${escapeHtml(message)}</div>`;
    }

    function updateDateTimeDisplay() {
        const now = new Date();
        dom.dateTimeInfo.textContent = now.toLocaleString([], {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    function updateConnectionStatus(connected) {
        if (connected) {
            dom.statusIndicator.classList.add('connected');
            dom.statusIndicator.textContent = '●';
            dom.statusText.textContent = 'Connected';
            dom.connectionStatus.textContent = 'Ready';
            dom.connectionStatus.classList.add('ready');
            dom.connectionStatus.classList.remove('error');
        } else {
            dom.statusIndicator.classList.remove('connected');
            dom.statusIndicator.textContent = '●';
            dom.statusText.textContent = 'Disconnected';
            dom.connectionStatus.textContent = 'Offline';
            dom.connectionStatus.classList.remove('ready');
            dom.connectionStatus.classList.add('error');
        }
    }

    function renderPromptLibrary() {
        if (!dom.promptLibrary) return;

        dom.promptLibrary.innerHTML = `
        <article class="prompt-card">
            <div class="prompt-card-header">
                <div>
                    <h3>${escapeHtml(TASK_API_REQUEST_PROMPT.title)}</h3>
                    <p class="prompt-card-purpose">${escapeHtml(TASK_API_REQUEST_PROMPT.purpose)}</p>
                </div>
                <div class="prompt-card-actions">
                    <span class="chip">Static</span>
                    <button class="chat-option prompt-toggle-button" type="button" data-prompt-toggle aria-expanded="true">Minimise</button>
                </div>
            </div>
            <pre class="prompt-card-body"><code>${escapeHtml(TASK_API_REQUEST_PROMPT.prompt)}</code></pre>
        </article>
    `;
    }

    function handlePromptLibraryClick(event) {
        const toggleButton = event.target.closest('[data-prompt-toggle]');
        if (!toggleButton) return;

        const promptCard = toggleButton.closest('.prompt-card');
        if (!promptCard) return;

        const isMinimized = !promptCard.classList.contains('is-minimized');
        promptCard.classList.toggle('is-minimized', isMinimized);
        toggleButton.textContent = isMinimized ? 'Expand' : 'Minimise';
        toggleButton.setAttribute('aria-expanded', String(!isMinimized));
    }

    function addUserMessage(text) {
        addMessage('message user-message', 'You', text);
    }

    function addSystemMessage(text, type = 'info') {
        showAnnouncement(text, type);
    }

    function showAnnouncement(text, type = 'info') {
        if (!dom.announcementBar || !dom.announcementText) return;

        window.clearTimeout(announcementTimer);
        dom.announcementText.textContent = text;
        dom.announcementBar.classList.remove('success', 'error', 'info');
        dom.announcementBar.classList.add(type);
        dom.announcementBar.hidden = false;

        announcementTimer = window.setTimeout(() => {
            hideAnnouncement();
        }, 5200);
    }

    function hideAnnouncement() {
        if (!dom.announcementBar) return;
        dom.announcementBar.hidden = true;
        window.clearTimeout(announcementTimer);
    }

    function addAIMessage(text, turnIndex) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message ai-message';
        messageElement.innerHTML = `
        <span class="timestamp">Agent</span>
        <p>${escapeHtml(text)}</p>
        <div class="message-actions">
            <button class="chat-option raise-task-button" type="button" data-turn-index="${turnIndex}">Raise Task</button>
        </div>
    `;
        dom.chatMessages.appendChild(messageElement);
        scrollToBottom();
    }

    function addMessage(className, timestamp, text) {
        const messageElement = document.createElement('div');
        messageElement.className = className;
        messageElement.innerHTML = `
        <span class="timestamp">${escapeHtml(timestamp)}</span>
        <p>${escapeHtml(text)}</p>
    `;
        dom.chatMessages.appendChild(messageElement);
        scrollToBottom();
    }

    function scrollToBottom() {
        dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
    }

    function openAgentChat() {
        document.body.classList.add('agent-chat-open');
        dom.chatPanel.setAttribute('aria-hidden', 'false');
        dom.agentChatToggle.setAttribute('aria-expanded', 'true');
        scrollToBottom();
        dom.messageInput.focus();
    }

    function closeAgentChat() {
        document.body.classList.remove('agent-chat-open');
        dom.chatPanel.setAttribute('aria-hidden', 'true');
        dom.agentChatToggle.setAttribute('aria-expanded', 'false');
        dom.agentChatToggle.focus();
    }

    function toggleAgentChat() {
        if (document.body.classList.contains('agent-chat-open')) {
            closeAgentChat();
        } else {
            openAgentChat();
        }
    }

    return {
        showAuthScreen,
        showAppScreen,
        setQuickLinkFilter,
        showView,
        updateCurrentUserDisplay,
        renderUserSettings,
        openSettingsModal,
        closeSettingsModal,
        setAuthStatus,
        setTaskFormStatus,
        setTaskListStatus,
        updateDateTimeDisplay,
        updateConnectionStatus,
        renderPromptLibrary,
        handlePromptLibraryClick,
        addUserMessage,
        addAIMessage,
        addSystemMessage,
        showAnnouncement,
        hideAnnouncement,
        scrollToBottom,
        openAgentChat,
        closeAgentChat,
        toggleAgentChat,
    };
}

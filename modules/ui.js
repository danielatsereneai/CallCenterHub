import { DEFAULT_QUICK_LINK_FILTER } from './config.js';
import {
    getPromptLibraryItems,
    resetPromptText,
    savePromptText,
} from './prompts.js';
import {
    escapeHtml,
    formatBoolean,
    formatDateTime,
    getUserDisplayName,
    getUserInitials,
    getUserType,
} from './utils.js';

const PINNED_TEAM_STORAGE_KEY = 'lifeAtPerchPinnedTeamDashboards';
const TEAM_DASHBOARDS = [
    {
        id: 'qc',
        shortName: 'QC',
        name: 'QC - Quality Control',
        description: 'Quality control checks, review workflows, and team links.',
        icon: 'QC',
        actions: [
            { icon: '✎', title: 'Feedback Submissions', text: 'Rewrite agent feedback into coaching notes before saving.', tool: 'feedbackSubmissions' },
        ],
        links: [
            { label: 'Mail', title: 'Outlook', detail: 'QC mail', url: 'https://outlook.office.com/mail/' },
            { label: 'Team', title: 'Teams', detail: 'QC Teams', url: 'https://teams.microsoft.com/' },
            { label: 'Web', title: 'Quality Hub', detail: 'Team workspace', url: 'https://www.perchgroup.co.uk/' },
        ],
    },
    {
        id: 'correspondence',
        shortName: 'COR',
        name: 'Correspondence Team',
        description: 'Correspondence handling, shared comms, and team workflow links.',
        icon: 'COR',
        actions: [
            { icon: 'AI', title: 'AI Email Response', text: 'Draft a customer email reply from the email and your findings.', tool: 'aiEmailResponse' },
        ],
        links: [
            { label: 'Mail', title: 'Outlook', detail: 'Correspondence mail', url: 'https://outlook.office.com/mail/' },
            { label: 'Team', title: 'Teams', detail: 'Correspondence Teams', url: 'https://teams.microsoft.com/' },
            { label: 'Web', title: 'PerchGroup', detail: 'Team workspace', url: 'https://www.perchgroup.co.uk/' },
        ],
    },
];

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
        feedbackSubmissionsTile: document.getElementById('feedbackSubmissionsTile'),
        feedbackModal: document.getElementById('feedbackModal'),
        feedbackForm: document.getElementById('feedbackForm'),
        closeFeedbackModalButton: document.getElementById('closeFeedbackModal'),
        cancelFeedbackButton: document.getElementById('cancelFeedbackButton'),
        clearFeedbackButton: document.getElementById('clearFeedbackButton'),
        rewriteFeedbackButton: document.getElementById('rewriteFeedbackButton'),
        saveFeedbackButton: document.getElementById('saveFeedbackButton'),
        feedbackSubmissionTypeInput: document.getElementById('feedbackSubmissionType'),
        feedbackActionTakenInput: document.getElementById('feedbackActionTaken'),
        feedbackActionRequiredInput: document.getElementById('feedbackActionRequired'),
        feedbackAgentEmailInput: document.getElementById('feedbackAgentEmail'),
        feedbackNotesInput: document.getElementById('feedbackNotes'),
        feedbackAiOutputInput: document.getElementById('feedbackAiOutput'),
        feedbackStatus: document.getElementById('feedbackStatus'),
        taskModal: document.getElementById('taskModal'),
        closeTaskModalButton: document.getElementById('closeTaskModal'),
        cancelTaskButton: document.getElementById('cancelTaskButton'),
        taskForm: document.getElementById('taskForm'),
        taskFormStatus: document.getElementById('taskFormStatus'),
        saveTaskButton: document.getElementById('saveTaskButton'),
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
        emailResponseModal: document.getElementById('emailResponseModal'),
        closeEmailResponseModalButton: document.getElementById('closeEmailResponseModal'),
        emailCustomerResponseInput: document.getElementById('emailCustomerResponse'),
        emailSummaryFindingsInput: document.getElementById('emailSummaryFindings'),
        emailResponseOutput: document.getElementById('emailResponseOutput'),
        emailResponseStatus: document.getElementById('emailResponseStatus'),
        copyEmailResponseButton: document.getElementById('copyEmailResponseButton'),
        generateEmailResponseButton: document.getElementById('generateEmailResponseButton'),
        clearEmailResponseButton: document.getElementById('clearEmailResponseButton'),
        refreshTasksButton: document.getElementById('refreshTasksButton'),
        mainNavList: document.getElementById('mainNavList'),
        navItems: document.querySelectorAll('.nav-item[data-view]'),
        homeViewElements: document.querySelectorAll('.home-view'),
        operationsPage: document.getElementById('operationsPage'),
        operationsTeamGrid: document.getElementById('operationsTeamGrid'),
        teamDashboardPage: document.getElementById('teamDashboardPage'),
        teamDashboardTitle: document.getElementById('teamDashboardTitle'),
        teamDashboardDescription: document.getElementById('teamDashboardDescription'),
        teamPinButton: document.getElementById('teamPinButton'),
        teamQuickActions: document.getElementById('teamQuickActions'),
        teamQuickLinks: document.getElementById('teamQuickLinks'),
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
        knowledgeTabs: document.getElementById('knowledgeTabs'),
        knowledgeTabButtons: document.querySelectorAll('[data-knowledge-tab]'),
        knowledgePanels: document.querySelectorAll('[data-knowledge-panel]'),
        feedbackKnowledgePanel: document.getElementById('feedbackKnowledgePanel'),
        promptsKnowledgePanel: document.getElementById('promptsKnowledgePanel'),
        feedbackKnowledgeList: document.getElementById('feedbackKnowledgeList'),
    };
}

export function createUi(dom) {
    let announcementTimer = null;
    let activeTeamId = '';
    let canEditPrompts = false;

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
        activeTeamId = view === 'team' ? activeTeamId : '';
        const isTasksView = view === 'tasks';
        const isKnowledgeView = view === 'knowledge';
        const isOperationsView = view === 'operations';
        const isTeamView = view === 'team';
        const isHomeView = view === 'command';
        dom.homeViewElements.forEach(element => {
            element.hidden = !isHomeView;
        });
        dom.operationsPage.hidden = !isOperationsView;
        dom.teamDashboardPage.hidden = !isTeamView;
        dom.tasksBoardPage.hidden = !isTasksView;
        dom.knowledgePage.hidden = !isKnowledgeView;
        getNavItems().forEach(item => {
            const isActiveTeam = isTeamView && item.dataset.teamId === activeTeamId;
            item.classList.toggle('active', item.dataset.view === view && (!isTeamView || isActiveTeam));
        });

        if (isTasksView && onTasksView) {
            onTasksView();
        }
    }

    function renderOperationsTeams() {
        if (!dom.operationsTeamGrid) return;

        dom.operationsTeamGrid.innerHTML = TEAM_DASHBOARDS.map(team => `
        <article class="team-tile" data-team-id="${escapeHtml(team.id)}">
            <div class="team-tile-icon">${escapeHtml(team.icon)}</div>
            <div>
                <h3>${escapeHtml(team.name)}</h3>
                <p>${escapeHtml(team.description)}</p>
            </div>
            <div class="team-tile-actions">
                <button class="chat-option" type="button" data-team-open="${escapeHtml(team.id)}">Open</button>
                <button class="send-button team-pin-toggle" type="button" data-team-pin-toggle="${escapeHtml(team.id)}">${getPinnedTeamIds().includes(team.id) ? 'Unpin' : 'Pin'}</button>
            </div>
        </article>
    `).join('');
    }

    function renderPinnedTeamNav() {
        if (!dom.mainNavList) return;

        dom.mainNavList.querySelectorAll('[data-pinned-team-nav]').forEach(item => item.remove());

        const pinnedTeams = getPinnedTeamIds()
            .map(teamId => getTeamById(teamId))
            .filter(Boolean);
        const insertionPoint = dom.mainNavList.querySelector('.nav-item[data-view="tasks"]')?.parentElement || null;

        pinnedTeams.forEach(team => {
            const item = document.createElement('li');
            item.dataset.pinnedTeamNav = team.id;
            item.innerHTML = `
            <a href="#" class="nav-item pinned-team-nav-item" data-view="team" data-team-id="${escapeHtml(team.id)}">
                <span class="nav-icon">${escapeHtml(team.icon)}</span>
                <span>${escapeHtml(team.shortName)}</span>
            </a>
        `;
            dom.mainNavList.insertBefore(item, insertionPoint);
        });
        updateNavActiveState();
    }

    function handleOperationsClick(event) {
        const pinButton = event.target.closest('[data-team-pin-toggle]');
        if (pinButton) {
            toggleTeamPin(pinButton.dataset.teamPinToggle);
            return;
        }

        const openButton = event.target.closest('[data-team-open]');
        const tile = event.target.closest('[data-team-id]');
        const teamId = openButton?.dataset.teamOpen || tile?.dataset.teamId || '';
        if (teamId) {
            openTeamDashboard(teamId);
        }
    }

    function handleTeamDashboardClick(event) {
        if (event.target.closest('[data-team-back]')) {
            showView('operations');
            return;
        }

        if (event.target.closest('[data-team-pin]')) {
            toggleTeamPin(activeTeamId);
            return;
        }

        const toolTile = event.target.closest('[data-team-tool]');
        if (toolTile?.dataset.teamTool === 'aiEmailResponse') {
            openEmailResponseModal();
            return;
        }

        if (toolTile?.dataset.teamTool === 'feedbackSubmissions') {
            window.dispatchEvent(new CustomEvent('open-feedback-submissions'));
        }
    }

    function openTeamDashboard(teamId) {
        const team = getTeamById(teamId);
        if (!team) return;

        activeTeamId = team.id;
        dom.teamDashboardTitle.textContent = team.name;
        dom.teamDashboardDescription.textContent = team.description;
        dom.teamQuickActions.innerHTML = team.actions.map(action => `
        <article class="action-tile${action.tool ? ' team-tool-tile' : ''}"${action.tool ? ` role="button" tabindex="0" data-team-tool="${escapeHtml(action.tool)}"` : ''}>
            <div class="tile-icon">${escapeHtml(action.icon)}</div>
            <b>${escapeHtml(action.title)}</b>
            <span>${escapeHtml(action.text)}</span>
        </article>
    `).join('');
        dom.teamQuickLinks.innerHTML = team.links.map(link => `
        <a class="mini-card quick-link-card" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
            <span class="quick-link-icon">${escapeHtml(link.label)}</span>
            <span class="quick-link-copy">
                <b>${escapeHtml(link.title)}</b>
                <small>${escapeHtml(link.detail)}</small>
            </span>
        </a>
    `).join('');
        updateTeamPinButton();
        showView('team');
    }

    function toggleTeamPin(teamId) {
        const team = getTeamById(teamId);
        if (!team) return;

        const pinnedTeamIds = getPinnedTeamIds();
        const nextPinnedTeamIds = pinnedTeamIds.includes(team.id)
            ? pinnedTeamIds.filter(pinnedTeamId => pinnedTeamId !== team.id)
            : [...pinnedTeamIds, team.id];

        setPinnedTeamIds(nextPinnedTeamIds);
        renderOperationsTeams();
        renderPinnedTeamNav();
        updateTeamPinButton();
    }

    function updateTeamPinButton() {
        if (!dom.teamPinButton || !activeTeamId) return;

        const isPinned = getPinnedTeamIds().includes(activeTeamId);
        dom.teamPinButton.textContent = isPinned ? 'Unpin' : 'Pin';
        dom.teamPinButton.setAttribute('aria-pressed', String(isPinned));
    }

    function updateNavActiveState() {
        if (!activeTeamId) return;

        getNavItems().forEach(item => {
            const isActiveTeam = item.dataset.view === 'team' && item.dataset.teamId === activeTeamId;
            item.classList.toggle('active', isActiveTeam);
        });
    }

    function getNavItems() {
        return [...document.querySelectorAll('.nav-item[data-view]')];
    }

    function getTeamById(teamId) {
        return TEAM_DASHBOARDS.find(team => team.id === teamId);
    }

    function getPinnedTeamIds() {
        try {
            const parsed = JSON.parse(window.localStorage?.getItem(PINNED_TEAM_STORAGE_KEY) || '[]');
            if (!Array.isArray(parsed)) return [];
            return parsed.filter(teamId => getTeamById(teamId));
        } catch {
            return [];
        }
    }

    function setPinnedTeamIds(teamIds) {
        try {
            window.localStorage?.setItem(PINNED_TEAM_STORAGE_KEY, JSON.stringify(teamIds));
        } catch {
            addSystemMessage('Pinned teams could not be saved in this browser.', 'error');
        }
    }

    function openEmailResponseModal() {
        dom.emailResponseModal.classList.add('open');
        dom.emailResponseModal.setAttribute('aria-hidden', 'false');
        setEmailResponseStatus('');
        dom.emailCustomerResponseInput.focus();
    }

    function closeEmailResponseModal() {
        dom.emailResponseModal.classList.remove('open');
        dom.emailResponseModal.setAttribute('aria-hidden', 'true');
    }

    function clearEmailResponseForm() {
        dom.emailCustomerResponseInput.value = '';
        dom.emailSummaryFindingsInput.value = '';
        dom.emailResponseOutput.textContent = 'Generated response will appear here.';
        setEmailResponseStatus('');
        dom.emailCustomerResponseInput.focus();
    }

    function setEmailResponseStatus(message, type = '') {
        dom.emailResponseStatus.textContent = message;
        dom.emailResponseStatus.classList.remove('success', 'error');
        if (type) dom.emailResponseStatus.classList.add(type);
    }

    function setEmailResponseOutput(responseText) {
        dom.emailResponseOutput.textContent = responseText || 'Generated response will appear here.';
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
            ['User Type', getUserType(user) || 'User'],
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

    function showKnowledgeSection(section = 'feedback') {
        const activeSection = section === 'prompts' ? 'prompts' : 'feedback';

        dom.knowledgeTabButtons.forEach(button => {
            const isActive = button.dataset.knowledgeTab === activeSection;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-selected', String(isActive));
        });

        dom.knowledgePanels.forEach(panel => {
            panel.hidden = panel.dataset.knowledgePanel !== activeSection;
        });
    }

    function handleKnowledgeTabsClick(event) {
        const tab = event.target.closest('[data-knowledge-tab]');
        if (!tab) return;

        showKnowledgeSection(tab.dataset.knowledgeTab);
    }

    function renderPromptLibrary() {
        if (!dom.promptLibrary) return;

        dom.promptLibrary.innerHTML = getPromptLibraryItems().map(promptItem => `
        <article class="prompt-card is-minimized" data-prompt-id="${escapeHtml(promptItem.id)}">
            <div class="prompt-card-header">
                <div>
                    <h3>${escapeHtml(promptItem.title)}</h3>
                    <p class="prompt-card-purpose">${escapeHtml(promptItem.purpose)}</p>
                </div>
                <div class="prompt-card-actions">
                    <span class="chip">${promptItem.isCustomized ? 'Custom' : 'Default'}</span>
                    <button class="chat-option prompt-copy-button" type="button" data-prompt-copy>Copy</button>
                    ${canEditPrompts ? '<button class="chat-option prompt-save-button" type="button" data-prompt-save>Save</button>' : ''}
                    ${canEditPrompts ? '<button class="chat-option prompt-reset-button" type="button" data-prompt-reset>Reset</button>' : ''}
                    <button class="chat-option prompt-toggle-button" type="button" data-prompt-toggle aria-expanded="false">Expand</button>
                </div>
            </div>
            <div class="prompt-card-body">
                <textarea class="prompt-card-editor" rows="18" spellcheck="false"${canEditPrompts ? '' : ' readonly'}>${escapeHtml(promptItem.prompt)}</textarea>
                <div class="prompt-card-status" aria-live="polite">${canEditPrompts ? '' : 'Prompt editing is available to Admin users only.'}</div>
            </div>
        </article>
    `).join('');
    }

    async function handlePromptLibraryClick(event) {
        const copyButton = event.target.closest('[data-prompt-copy]');
        if (copyButton) {
            await copyPromptCardText(copyButton);
            return;
        }

        const saveButton = event.target.closest('[data-prompt-save]');
        if (saveButton) {
            savePromptCardText(saveButton);
            return;
        }

        const resetButton = event.target.closest('[data-prompt-reset]');
        if (resetButton) {
            resetPromptCardText(resetButton);
            return;
        }

        const toggleButton = event.target.closest('[data-prompt-toggle]');
        if (!toggleButton) return;

        const promptCard = toggleButton.closest('.prompt-card');
        if (!promptCard) return;

        const isMinimized = !promptCard.classList.contains('is-minimized');
        promptCard.classList.toggle('is-minimized', isMinimized);
        toggleButton.textContent = isMinimized ? 'Expand' : 'Minimise';
        toggleButton.setAttribute('aria-expanded', String(!isMinimized));
    }

    function savePromptCardText(saveButton) {
        const promptCard = saveButton.closest('.prompt-card');
        const promptId = promptCard?.dataset.promptId || '';
        const editor = promptCard?.querySelector('.prompt-card-editor');
        const status = promptCard?.querySelector('.prompt-card-status');

        if (!canEditPrompts) {
            if (status) {
                status.textContent = 'Prompt editing is available to Admin users only.';
                status.classList.remove('success');
                status.classList.add('error');
            }
            return;
        }

        try {
            const savedPrompt = savePromptText(promptId, editor?.value || '');
            if (status) {
                status.textContent = 'Prompt saved. AI flows will use this version.';
                status.classList.remove('error');
                status.classList.add('success');
            }
            updatePromptCardBadge(promptCard, savedPrompt?.isCustomized);
        } catch (error) {
            if (status) {
                status.textContent = error.message;
                status.classList.remove('success');
                status.classList.add('error');
            }
        }
    }

    function resetPromptCardText(resetButton) {
        const promptCard = resetButton.closest('.prompt-card');
        const promptId = promptCard?.dataset.promptId || '';
        const editor = promptCard?.querySelector('.prompt-card-editor');
        const status = promptCard?.querySelector('.prompt-card-status');

        if (!canEditPrompts) {
            if (status) {
                status.textContent = 'Prompt editing is available to Admin users only.';
                status.classList.remove('success');
                status.classList.add('error');
            }
            return;
        }

        const resetPrompt = resetPromptText(promptId);

        if (editor) {
            editor.value = resetPrompt?.prompt || '';
        }
        if (status) {
            status.textContent = 'Prompt reset to the default version.';
            status.classList.remove('error');
            status.classList.add('success');
        }
        updatePromptCardBadge(promptCard, resetPrompt?.isCustomized);
    }

    function updatePromptCardBadge(promptCard, isCustomized) {
        const badge = promptCard?.querySelector('.chip');
        if (badge) {
            badge.textContent = isCustomized ? 'Custom' : 'Default';
        }
    }

    function setPromptEditPermission(canEdit) {
        canEditPrompts = Boolean(canEdit);
        renderPromptLibrary();
    }

    async function copyPromptCardText(copyButton) {
        const promptCard = copyButton.closest('.prompt-card');
        const promptText = promptCard?.querySelector('.prompt-card-editor')?.value?.trim() || '';
        if (!promptText) return;

        try {
            await copyTextToClipboard(promptText);
            copyButton.textContent = 'Copied';
            window.setTimeout(() => {
                copyButton.textContent = 'Copy';
            }, 1600);
        } catch (error) {
            console.error('Prompt copy error:', error);
            addSystemMessage('Prompt could not be copied. Select the prompt text and copy it manually.', 'error');
        }
    }

    async function copyTextToClipboard(text) {
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
        renderOperationsTeams,
        renderPinnedTeamNav,
        handleOperationsClick,
        handleTeamDashboardClick,
        openTeamDashboard,
        openEmailResponseModal,
        closeEmailResponseModal,
        clearEmailResponseForm,
        setEmailResponseStatus,
        setEmailResponseOutput,
        updateCurrentUserDisplay,
        renderUserSettings,
        openSettingsModal,
        closeSettingsModal,
        setAuthStatus,
        setTaskFormStatus,
        setTaskListStatus,
        updateDateTimeDisplay,
        updateConnectionStatus,
        showKnowledgeSection,
        handleKnowledgeTabsClick,
        setPromptEditPermission,
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

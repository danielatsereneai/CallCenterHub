import { LIFE_AT_PERCH_AREAS, TASK_STATUSES } from './config.js';
import {
    escapeHtml,
    formatDateTime,
    getTaskStatusLabel,
    getUserDisplayName,
    normalizeAssignmentValue,
    normalizeTaskStatus,
    parseTaskJson,
    toDateTimeLocalValue,
} from './utils.js';

export function createTaskController({
    dom,
    ui,
    pocketbase,
    session,
    getCurrentUser,
    getCurrentUserToken,
    onSystemMessage,
}) {
    let savedTasks = [];
    let availableUsers = [];
    let taskJsonDraft = {};
    let draggedTaskIndex = null;

    function hydratePocketBaseTokenInputs() {
        const token = session.hydratePocketBaseToken();
        if (dom.pocketbaseTokenInput) {
            dom.pocketbaseTokenInput.value = token;
        }
        if (dom.taskPanelTokenInput) {
            dom.taskPanelTokenInput.value = token;
        }
    }

    function syncPocketBaseTokenFromPanel() {
        if (!dom.taskPanelTokenInput) return;
        session.persistPocketBaseToken(dom.taskPanelTokenInput.value.trim());
        hydratePocketBaseTokenInputs();
    }

    function syncPocketBaseTokenFromModal() {
        if (!dom.pocketbaseTokenInput) return;
        session.persistPocketBaseToken(dom.pocketbaseTokenInput.value.trim());
        hydratePocketBaseTokenInputs();
    }

    function getPocketBaseAuthToken() {
        return dom.taskPanelTokenInput?.value.trim()
            || session.hydratePocketBaseToken()
            || getCurrentUserToken()
            || '';
    }

    async function refreshPocketBaseData() {
        await loadAvailableUsers({ silent: true });
        await loadPocketBaseTasks();
    }

    async function loadAvailableUsers(options = {}) {
        const token = getPocketBaseAuthToken();

        try {
            const result = await pocketbase.loadAvailableUsers(token);
            availableUsers = result.items || [];
        } catch (error) {
            console.error('PocketBase user load error:', error);
            availableUsers = getCurrentUser() ? [getCurrentUser()] : [];

            if (!options.silent) {
                onSystemMessage(`User list load failed: ${error.message}`);
            }
        }

        populateAssignedSelect(dom.taskAssignedSelect.value);
    }

    async function loadPocketBaseTasks(options = {}) {
        const enteredToken = dom.taskPanelTokenInput?.value.trim() || '';
        session.persistPocketBaseToken(enteredToken);
        hydratePocketBaseTokenInputs();
        const token = enteredToken || getCurrentUserToken();

        if (!options.silent) {
            ui.setTaskListStatus('Loading PocketBase tasks...');
        }

        if (dom.refreshTasksButton) {
            dom.refreshTasksButton.disabled = true;
        }

        try {
            const result = await pocketbase.fetchPocketBaseTasks(token);
            savedTasks = result.items || [];
            renderSavedTasks();
            populateBoardSelect();
            renderKanbanBoard();

            if (!options.silent) {
                onSystemMessage(`Loaded ${savedTasks.length} task${savedTasks.length === 1 ? '' : 's'} from PocketBase.`);
            }
        } catch (error) {
            console.error('PocketBase task load error:', error);
            savedTasks = [];
            dom.taskCount.textContent = '0';
            ui.setTaskListStatus(`${error.message} Add a token if this collection is private.`, 'error');
            populateBoardSelect();
            renderKanbanBoard();

            if (!options.silent) {
                onSystemMessage(`Task load failed: ${error.message}`);
            }
        } finally {
            if (dom.refreshTasksButton) {
                dom.refreshTasksButton.disabled = false;
            }
        }
    }

    function clearTaskState() {
        availableUsers = [];
        savedTasks = [];
        renderSavedTasks();
        populateAssignedSelect();
    }

    function populateAssignedSelect(selectedValue = '') {
        const userOptions = availableUsers.map(user => {
            const label = getUserDisplayName(user);
            return {
                label,
                value: getUserAssignmentValue(user),
            };
        });
        const resolvedSelectedValue = resolveAssignmentValue(selectedValue);
        const hasSelectedValue = resolvedSelectedValue && userOptions.some(option => option.value === resolvedSelectedValue);

        if (resolvedSelectedValue && !hasSelectedValue) {
            userOptions.unshift({
                label: getAssignedDisplayName(resolvedSelectedValue),
                value: resolvedSelectedValue,
            });
        }

        dom.taskAssignedSelect.innerHTML = [
            '<option value="">Unassigned</option>',
            ...userOptions.map(option => (
                `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`
            )),
        ].join('');
        const hasMatchingOption = [...dom.taskAssignedSelect.options].some(option => option.value === resolvedSelectedValue);
        dom.taskAssignedSelect.value = resolvedSelectedValue && hasMatchingOption ? resolvedSelectedValue : '';
    }

    function getUserAssignmentValue(user) {
        return user?.id || getUserDisplayName(user);
    }

    function resolveAssignmentValue(value) {
        const normalizedValue = normalizeAssignmentValue(value);
        if (!normalizedValue) return '';

        const matchingUser = availableUsers.find(user => {
            const displayName = getUserDisplayName(user);
            return user.id === normalizedValue
                || user.email === normalizedValue
                || user.name === normalizedValue
                || displayName === normalizedValue;
        });

        return matchingUser ? getUserAssignmentValue(matchingUser) : normalizedValue;
    }

    function getAssignedDisplayName(value) {
        const normalizedValue = normalizeAssignmentValue(value);
        if (!normalizedValue) return '';

        const matchingUser = availableUsers.find(user => {
            const displayName = getUserDisplayName(user);
            return user.id === normalizedValue
                || user.email === normalizedValue
                || user.name === normalizedValue
                || displayName === normalizedValue;
        });

        return matchingUser ? getUserDisplayName(matchingUser) : normalizedValue;
    }

    function openTaskModal() {
        setTaskFormMode('create');
        dom.taskModal.dataset.recordId = '';
        dom.taskForm.reset();
        taskJsonDraft = {};
        renderTaskComments();
        hydratePocketBaseTokenInputs();
        populateAssignedSelect(getCurrentUser() ? getUserAssignmentValue(getCurrentUser()) : '');
        dom.taskIdInput.value = Date.now();
        document.getElementById('taskStatus').value = 'new';
        document.getElementById('taskBoardName').value = getSelectedBoardName();
        ui.setTaskFormStatus('');
        dom.taskModal.classList.add('open');
        dom.taskModal.setAttribute('aria-hidden', 'false');
        document.getElementById('taskName').focus();
    }

    function openBoardTaskModal() {
        openTaskModal();
        document.getElementById('taskBoardName').value = getSelectedBoardName();
    }

    function openTaskModalWithDraft(taskDraft) {
        setTaskFormMode('create');
        dom.taskModal.dataset.recordId = '';
        dom.taskForm.reset();
        taskJsonDraft = {};
        renderTaskComments();
        hydratePocketBaseTokenInputs();
        fillTaskDraft(taskDraft);
        ui.setTaskFormStatus('Review the task raised from chat, then save it to PocketBase.');
        dom.taskModal.classList.add('open');
        dom.taskModal.setAttribute('aria-hidden', 'false');
        document.getElementById('taskName').focus();
    }

    function openTaskView(taskIndex) {
        const task = savedTasks[taskIndex];
        if (!task) return;

        setTaskFormMode('edit');
        dom.taskModal.dataset.recordId = task.id || '';
        fillTaskForm(task);
        ui.setTaskFormStatus('Update this PocketBase task, then save your changes.');
        dom.taskModal.classList.add('open');
        dom.taskModal.setAttribute('aria-hidden', 'false');
        document.getElementById('taskName').focus();
    }

    function closeTaskModal() {
        dom.taskModal.classList.remove('open');
        dom.taskModal.setAttribute('aria-hidden', 'true');
        dom.taskModal.dataset.recordId = '';
        setTaskFormMode('create');
        dom.newTaskTile.focus();
    }

    function handleTaskTileKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openTaskModal();
        }
    }

    function handleTaskModalBackdropClick(event) {
        if (event.target === dom.taskModal) {
            closeTaskModal();
        }
    }

    function handleTaskListClick(event) {
        const taskRow = event.target.closest('.task-row');
        if (!taskRow) return;

        openTaskView(Number(taskRow.dataset.taskIndex));
    }

    function handleTaskListKeydown(event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;

        const taskRow = event.target.closest('.task-row');
        if (!taskRow) return;

        event.preventDefault();
        openTaskView(Number(taskRow.dataset.taskIndex));
    }

    function handleKanbanClick(event) {
        const card = event.target.closest('.kanban-card');
        if (!card) return;

        openTaskView(Number(card.dataset.taskIndex));
    }

    function handleKanbanKeydown(event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;

        const card = event.target.closest('.kanban-card');
        if (!card) return;

        event.preventDefault();
        openTaskView(Number(card.dataset.taskIndex));
    }

    function handleKanbanDragStart(event) {
        const card = event.target.closest('.kanban-card');
        if (!card) return;

        draggedTaskIndex = Number(card.dataset.taskIndex);
        card.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(draggedTaskIndex));
    }

    function handleKanbanDragOver(event) {
        const column = event.target.closest('.kanban-column');
        if (!column || draggedTaskIndex === null) return;

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        column.classList.add('drag-over');
    }

    function handleKanbanDragLeave(event) {
        const column = event.target.closest('.kanban-column');
        if (!column || column.contains(event.relatedTarget)) return;

        column.classList.remove('drag-over');
    }

    async function handleKanbanDrop(event) {
        const column = event.target.closest('.kanban-column');
        if (!column) return;

        event.preventDefault();
        column.classList.remove('drag-over');

        const taskIndex = draggedTaskIndex ?? Number(event.dataTransfer.getData('text/plain'));
        const nextStatus = normalizeTaskStatus(column.dataset.status);
        await updateTaskStatusFromBoard(taskIndex, nextStatus);
    }

    function handleKanbanDragEnd(event) {
        const card = event.target.closest('.kanban-card');
        if (card) {
            card.classList.remove('dragging');
        }

        dom.kanbanBoard.querySelectorAll('.kanban-column.drag-over').forEach(column => {
            column.classList.remove('drag-over');
        });
        draggedTaskIndex = null;
    }

    async function saveTask(event) {
        event.preventDefault();
        if (dom.taskModal.dataset.mode === 'view') return;

        const recordId = dom.taskModal.dataset.recordId || '';
        ui.setTaskFormStatus(recordId ? 'Updating task in PocketBase...' : 'Saving task to PocketBase...');
        dom.saveTaskButton.disabled = true;

        try {
            const taskData = getTaskFormData();
            const record = recordId
                ? await updatePocketBaseTaskWithFallback(recordId, taskData)
                : await createPocketBaseTaskWithFallback(taskData);

            if (recordId) {
                savedTasks = savedTasks.map(task => task.id === recordId ? record : task);
                taskJsonDraft = parseTaskJson(record.Json);
                renderTaskComments();
            } else {
                savedTasks = [record, ...savedTasks];
            }

            renderSavedTasks();
            populateBoardSelect();
            renderKanbanBoard();
            onSystemMessage(`Task "${record.task_name || taskData.task_name}" ${recordId ? 'updated' : 'saved'} in PocketBase.`);
            ui.setTaskFormStatus(recordId ? 'Task updated.' : 'Task saved.', 'success');
            loadPocketBaseTasks({ silent: true });
            setTimeout(closeTaskModal, 500);
        } catch (error) {
            console.error('PocketBase task save error:', error);
            ui.setTaskFormStatus(error.message, 'error');
            onSystemMessage(`Task save failed: ${error.message}`);
        } finally {
            dom.saveTaskButton.disabled = false;
        }
    }

    async function addTaskComment() {
        const recordId = dom.taskModal.dataset.recordId || '';
        const commentText = dom.taskCommentInput.value.trim();

        if (!recordId) {
            ui.setTaskFormStatus('Save the task before adding comments.', 'error');
            return;
        }

        if (!commentText) {
            ui.setTaskFormStatus('Write a comment before adding it.', 'error');
            return;
        }

        const taskIndex = savedTasks.findIndex(task => task.id === recordId);
        const task = savedTasks[taskIndex];

        if (!task) {
            ui.setTaskFormStatus('Could not find this task in the loaded task list.', 'error');
            return;
        }

        dom.addTaskCommentButton.disabled = true;
        ui.setTaskFormStatus('Adding comment...');

        try {
            const updatedTask = buildTaskWithComment(task, commentText);
            const record = await pocketbase.patchPocketBaseTaskComments(recordId, updatedTask.Json, getPocketBaseAuthToken());
            savedTasks[taskIndex] = record;
            taskJsonDraft = parseTaskJson(record.Json);
            dom.taskCommentInput.value = '';
            renderTaskComments();
            renderSavedTasks();
            renderKanbanBoard();
            ui.setTaskFormStatus('Comment added.', 'success');
        } catch (error) {
            console.error('PocketBase task comment error:', error);
            ui.setTaskFormStatus(`Comment failed: ${error.message}`, 'error');
        } finally {
            dom.addTaskCommentButton.disabled = false;
        }
    }

    function buildTaskWithComment(task, commentText) {
        const json = parseTaskJson(task.Json);
        const comments = getTaskComments(task);
        const currentUser = getCurrentUser();
        const userName = currentUser ? getUserDisplayName(currentUser) : 'Unknown User';

        json.task_comments = [
            ...comments,
            {
                id: `comment-${Date.now()}`,
                body: commentText,
                created_at: new Date().toISOString(),
                user_id: currentUser?.id || '',
                user_name: userName,
                user_email: currentUser?.email || '',
            },
        ];

        return {
            ...task,
            Json: json,
        };
    }

    async function updateTaskStatusFromBoard(taskIndex, nextStatus) {
        const task = savedTasks[taskIndex];
        if (!task || !task.id) {
            onSystemMessage('Task status update failed: missing PocketBase record id.');
            return;
        }

        const currentStatus = getTaskStatus(task);
        if (currentStatus === nextStatus) return;

        const previousTask = { ...task };
        const nextTask = buildUpdatedTaskStatus(task, nextStatus);
        savedTasks[taskIndex] = nextTask;
        renderSavedTasks();
        renderKanbanBoard();

        try {
            const updatedRecord = await patchPocketBaseTaskStatusWithFallback(task.id, nextTask);
            savedTasks[taskIndex] = updatedRecord;
            renderSavedTasks();
            populateBoardSelect();
            renderKanbanBoard();
            onSystemMessage(`Task "${updatedRecord.task_name || nextTask.task_name || 'Untitled task'}" moved to ${getTaskStatusLabel(nextStatus)}.`);
        } catch (error) {
            console.error('PocketBase task status update error:', error);
            savedTasks[taskIndex] = previousTask;
            renderSavedTasks();
            renderKanbanBoard();
            onSystemMessage(`Task status update failed: ${error.message}`);
        }
    }

    function buildUpdatedTaskStatus(task, nextStatus) {
        const json = parseTaskJson(task.Json);
        json.status = nextStatus;
        json.board_name = getTaskBoardName(task);
        json.assigned = getTaskAssignedValue(task);
        json.assigned_label = getTaskAssignedLabel(task);

        return {
            ...task,
            Json: json,
            task_status: nextStatus,
        };
    }

    async function patchPocketBaseTaskStatusWithFallback(recordId, task) {
        try {
            return await sendPocketBaseTaskStatusPatch(recordId, task, true);
        } catch (error) {
            if (!error.message.includes('400')) throw error;
            return sendPocketBaseTaskStatusPatch(recordId, task, false);
        }
    }

    async function sendPocketBaseTaskStatusPatch(recordId, task, includeBoardAlias) {
        const boardName = getTaskBoardName(task);
        const payload = {
            Json: task.Json,
            task_status: getTaskStatus(task),
            board_name: boardName,
        };

        if (includeBoardAlias) {
            payload.Board_Name = boardName;
        }

        return pocketbase.patchPocketBaseTaskStatus(recordId, payload, getPocketBaseAuthToken());
    }

    function getTaskFormData() {
        const dueDateInput = document.getElementById('taskDueDate').value;
        const attachment = document.getElementById('taskAttachment').files[0] || null;
        const jsonValue = { ...taskJsonDraft };
        const taskStatus = normalizeTaskStatus(document.getElementById('taskStatus').value);
        jsonValue.status = taskStatus;
        const boardName = document.getElementById('taskBoardName').value.trim();
        const assignedValue = document.getElementById('taskAssigned').value.trim();
        jsonValue.board_name = boardName;
        jsonValue.assigned = assignedValue;
        jsonValue.assigned_label = getAssignedDisplayName(assignedValue);

        const enteredToken = dom.taskPanelTokenInput?.value.trim() || '';
        const token = enteredToken || session.hydratePocketBaseToken() || '';
        session.persistPocketBaseToken(enteredToken);
        hydratePocketBaseTokenInputs();

        return {
            due_date: dueDateInput ? new Date(dueDateInput).toISOString() : '',
            task_name: document.getElementById('taskName').value.trim(),
            task_description: document.getElementById('taskDescription').value.trim(),
            assigned: assignedValue,
            board_name: boardName,
            task_status: taskStatus,
            Json: jsonValue,
            Notes: document.getElementById('taskNotes').value.trim(),
            task_id: Number(dom.taskIdInput.value || Date.now()),
            attatchemnt: attachment,
            token,
        };
    }

    async function createPocketBaseTaskWithFallback(taskData) {
        const assignedCandidates = getAssignedSaveCandidates(taskData.assigned);
        let lastError = null;

        for (const assigned of assignedCandidates) {
            try {
                return await pocketbase.createPocketBaseTask({
                    ...taskData,
                    assigned,
                }, taskData.token || getCurrentUserToken());
            } catch (error) {
                lastError = error;

                if (!taskData.assigned || !error.message.includes('400')) {
                    throw error;
                }
            }
        }

        if (taskData.assigned) {
            return pocketbase.createPocketBaseTask({
                ...taskData,
                assigned: '',
            }, taskData.token || getCurrentUserToken());
        }

        throw lastError;
    }

    async function updatePocketBaseTaskWithFallback(recordId, taskData) {
        const assignedCandidates = getAssignedSaveCandidates(taskData.assigned);
        let lastError = null;
        const token = taskData.token || getCurrentUserToken();

        for (const assigned of assignedCandidates) {
            try {
                return await pocketbase.updatePocketBaseTask(recordId, {
                    ...taskData,
                    assigned,
                }, token, true);
            } catch (error) {
                lastError = error;

                if (!taskData.assigned || !error.message.includes('400')) {
                    throw error;
                }
            }
        }

        try {
            return await pocketbase.updatePocketBaseTask(recordId, {
                ...taskData,
                assigned: '',
            }, token, true);
        } catch (error) {
            if (!error.message.includes('400')) throw error;
            return pocketbase.updatePocketBaseTask(recordId, {
                ...taskData,
                assigned: '',
            }, token, false);
        }
    }

    function getAssignedSaveCandidates(value) {
        const normalizedValue = normalizeAssignmentValue(value);
        if (!normalizedValue) return [''];

        const displayName = getAssignedDisplayName(normalizedValue);
        const candidates = [
            normalizedValue,
            [normalizedValue],
        ];

        if (displayName && displayName !== normalizedValue) {
            candidates.push(displayName, [displayName]);
        }

        return candidates;
    }

    function renderSavedTasks() {
        const userTasks = getTasksAssignedToCurrentUser();
        dom.taskCount.textContent = String(userTasks.length);

        if (!userTasks.length) {
            ui.setTaskListStatus('No tasks assigned to you.');
            return;
        }

        dom.taskList.innerHTML = userTasks.map(({ task, index }) => `
        <div class="task-row" role="button" tabindex="0" data-task-index="${index}">
            <b>${escapeHtml(task.task_name || 'Untitled task')}</b>
            <span class="task-meta">${escapeHtml(getTaskStatusLabel(getTaskStatus(task)))}</span>
            <span>${escapeHtml(getTaskPreview(task))}</span>
            <span>${escapeHtml(getTaskMetaLine(task))}</span>
        </div>
    `).join('');
    }

    function renderTaskComments() {
        const recordId = dom.taskModal.dataset.recordId || '';
        const comments = getTaskComments({ Json: taskJsonDraft });
        dom.taskCommentCount.textContent = String(comments.length);
        dom.addTaskCommentButton.disabled = !recordId;
        dom.taskCommentInput.disabled = !recordId;
        dom.taskCommentInput.placeholder = recordId ? 'Add a task update...' : 'Save the task before adding comments';

        if (!comments.length) {
            dom.taskCommentList.innerHTML = `<div class="empty-state">${recordId ? 'No comments yet.' : 'Comments will be available after this task is saved.'}</div>`;
            return;
        }

        dom.taskCommentList.innerHTML = comments.map(comment => `
        <article class="task-comment">
            <div class="task-comment-meta">
                <b>${escapeHtml(comment.user_name || comment.user_email || 'Unknown User')}</b>
                <span>${escapeHtml(formatDateTime(comment.created_at))}</span>
            </div>
            <p>${escapeHtml(comment.body || '')}</p>
        </article>
    `).join('');
    }

    function getTaskComments(task) {
        const json = parseTaskJson(task.Json);
        const comments = json?.task_comments || json?.comments || [];
        return Array.isArray(comments) ? comments : [];
    }

    function getTasksAssignedToCurrentUser() {
        if (!getCurrentUser()) return [];

        return savedTasks
            .map((task, index) => ({ task, index }))
            .filter(({ task }) => isTaskAssignedToCurrentUser(task));
    }

    function isTaskAssignedToCurrentUser(task) {
        const assignedValue = normalizeAssignmentValue(getTaskAssignedValue(task));
        const currentUser = getCurrentUser();
        if (!assignedValue || !currentUser) return false;

        const currentUserValues = [
            currentUser.id,
            currentUser.email,
            currentUser.name,
            getUserDisplayName(currentUser),
        ].map(normalizeAssignmentValue).filter(Boolean);

        return currentUserValues.includes(assignedValue);
    }

    function fillTaskForm(task) {
        taskJsonDraft = parseTaskJson(task.Json);
        renderTaskComments();
        const assignedValue = getTaskAssignedValue(task);
        populateAssignedSelect(assignedValue);
        document.getElementById('taskName').value = task.task_name || '';
        document.getElementById('taskDueDate').value = toDateTimeLocalValue(task.due_date);
        document.getElementById('taskAssigned').value = resolveAssignmentValue(assignedValue);
        document.getElementById('taskBoardName').value = getTaskBoardName(task);
        document.getElementById('taskStatus').value = getTaskStatus(task);
        document.getElementById('taskDescription').value = task.task_description || '';
        document.getElementById('taskNotes').value = task.Notes || '';
        dom.taskIdInput.value = task.task_id || '';
        document.getElementById('taskAttachment').value = '';
    }

    function fillTaskDraft(taskDraft) {
        const assignedValue = taskDraft.assigned || (getCurrentUser() ? getUserAssignmentValue(getCurrentUser()) : '');
        taskJsonDraft = parseTaskJson(taskDraft.Json);
        renderTaskComments();
        populateAssignedSelect(assignedValue);
        document.getElementById('taskName').value = taskDraft.task_name;
        document.getElementById('taskDueDate').value = '';
        document.getElementById('taskAssigned').value = resolveAssignmentValue(assignedValue);
        document.getElementById('taskBoardName').value = taskDraft.board_name || getSelectedBoardName();
        document.getElementById('taskStatus').value = getTaskStatus(taskDraft);
        document.getElementById('taskDescription').value = taskDraft.task_description;
        document.getElementById('taskNotes').value = taskDraft.Notes;
        dom.taskIdInput.value = taskDraft.task_id;
        document.getElementById('taskAttachment').value = '';
    }

    function setTaskFormMode(mode) {
        const isViewing = mode === 'view';
        const isEditing = mode === 'edit';
        dom.taskModal.dataset.mode = mode;
        dom.taskModalTitle.textContent = isViewing ? 'View Task' : isEditing ? 'Edit Task' : 'New Task';
        dom.saveTaskButton.style.display = isViewing ? 'none' : '';
        dom.saveTaskButton.disabled = isViewing;
        dom.cancelTaskButton.textContent = isViewing ? 'Close' : 'Cancel';
        dom.saveTaskButton.textContent = isEditing ? 'Update Task' : 'Save Task';
        dom.taskForm.querySelectorAll('input, textarea, select').forEach(field => {
            if (field.id === 'taskAttachment') {
                field.closest('label').style.display = isViewing ? 'none' : '';
                field.disabled = isViewing;
                return;
            }

            if (field.tagName === 'SELECT') {
                field.disabled = isViewing;
            } else {
                field.readOnly = isViewing;
            }
        });
    }

    function getTaskPreview(task) {
        return task.task_description || task.Notes || 'No description added.';
    }

    function populateBoardSelect() {
        const currentValue = dom.boardSelect.value || 'all';
        const defaultBoardNames = LIFE_AT_PERCH_AREAS.map(area => area.label);
        const savedBoardNames = [...new Set(savedTasks.map(getTaskBoardName).filter(Boolean))]
            .filter(board => !defaultBoardNames.includes(board))
            .sort((a, b) => a.localeCompare(b));
        const boardNames = [...defaultBoardNames, ...savedBoardNames];
        dom.boardSelect.innerHTML = [
            '<option value="all">All Boards</option>',
            ...boardNames.map(board => `<option value="${escapeHtml(board)}">${escapeHtml(board)}</option>`),
        ].join('');
        dom.boardSelect.value = boardNames.includes(currentValue) ? currentValue : 'all';
    }

    function renderKanbanBoard() {
        const selectedBoard = dom.boardSelect.value || 'all';
        const filteredTasks = selectedBoard === 'all'
            ? savedTasks
            : savedTasks.filter(task => getTaskBoardName(task) === selectedBoard);

        TASK_STATUSES.forEach(status => {
            const column = dom.kanbanBoard.querySelector(`[data-status="${status.id}"]`);
            if (!column) return;

            const tasks = filteredTasks.filter(task => getTaskStatus(task) === status.id);
            column.querySelector('.kanban-column-header b').textContent = String(tasks.length);
            column.querySelector('.kanban-items').innerHTML = tasks.length
                ? tasks.map(task => renderKanbanCard(task, savedTasks.indexOf(task))).join('')
                : '<div class="empty-state">No tasks</div>';
        });
    }

    function renderKanbanCard(task, index) {
        const assignedLabel = getTaskAssignedLabel(task);
        return `
        <article class="kanban-card" role="button" tabindex="0" draggable="true" data-task-index="${index}">
            <b>${escapeHtml(task.task_name || 'Untitled task')}</b>
            <span>${escapeHtml(getTaskPreview(task))}</span>
            <span class="card-owner">${escapeHtml(assignedLabel ? `Owner: ${assignedLabel}` : 'Unassigned')}</span>
            <span>${escapeHtml(getTaskBoardName(task) || 'No board')}</span>
        </article>
    `;
    }

    function getSelectedBoardName() {
        return dom.boardSelect.value && dom.boardSelect.value !== 'all' ? dom.boardSelect.value : '';
    }

    function getTaskMetaLine(task) {
        const boardName = getTaskBoardName(task);
        const assignedLabel = getTaskAssignedLabel(task);
        const parts = [
            boardName ? `Board: ${boardName}` : 'No board',
            assignedLabel ? `Owner: ${assignedLabel}` : 'Unassigned',
        ];
        return parts.join(' · ');
    }

    function getTaskAssignedValue(task) {
        const json = parseTaskJson(task.Json);
        return normalizeAssignmentValue(task.assigned || json?.assigned || json?.assigned_id || '');
    }

    function getTaskAssignedLabel(task) {
        const json = parseTaskJson(task.Json);
        const assignedValue = getTaskAssignedValue(task);
        return json?.assigned_label || getAssignedDisplayName(assignedValue);
    }

    function getTaskBoardName(task) {
        const json = parseTaskJson(task.Json);
        return String(task.board_name || task.Board_Name || task.boardName || task.board || json?.board_name || json?.Board_Name || json?.boardName || json?.board || '').trim();
    }

    function getTaskStatus(task) {
        const json = parseTaskJson(task.Json);
        return normalizeTaskStatus(task.task_status || json?.status || task.status || 'new');
    }

    return {
        hydratePocketBaseTokenInputs,
        syncPocketBaseTokenFromPanel,
        syncPocketBaseTokenFromModal,
        refreshPocketBaseData,
        loadAvailableUsers,
        loadPocketBaseTasks,
        clearTaskState,
        populateAssignedSelect,
        openTaskModal,
        openBoardTaskModal,
        openTaskModalWithDraft,
        closeTaskModal,
        handleTaskTileKeydown,
        handleTaskModalBackdropClick,
        handleTaskListClick,
        handleTaskListKeydown,
        handleKanbanClick,
        handleKanbanKeydown,
        handleKanbanDragStart,
        handleKanbanDragOver,
        handleKanbanDragLeave,
        handleKanbanDrop,
        handleKanbanDragEnd,
        saveTask,
        addTaskComment,
        renderKanbanBoard,
        getSelectedBoardName,
    };
}

import {
    escapeHtml,
    formatDateTime,
    parseTaskJson,
} from './utils.js';

const FEEDBACK_SOURCE = 'feedback-submission';
const DEFAULT_AI_OUTPUT_PLACEHOLDER = 'AI coaching feedback will appear here for review.';

export function createFeedbackController({
    dom,
    ui,
    chat,
    tasks,
    getCurrentUser,
    onSystemMessage,
}) {
    let lastAiModel = '';
    let lastAiOutput = '';

    function openFeedbackModal() {
        dom.feedbackModal.classList.add('open');
        dom.feedbackModal.setAttribute('aria-hidden', 'false');
        setFeedbackStatus('');
        dom.feedbackAgentEmailInput.focus();
    }

    function closeFeedbackModal() {
        dom.feedbackModal.classList.remove('open');
        dom.feedbackModal.setAttribute('aria-hidden', 'true');
        dom.feedbackSubmissionsTile?.focus();
    }

    function clearFeedbackForm() {
        dom.feedbackForm.reset();
        dom.feedbackSubmissionTypeInput.value = 'General';
        dom.feedbackAiOutputInput.value = '';
        lastAiModel = '';
        lastAiOutput = '';
        setFeedbackStatus('');
        dom.feedbackAgentEmailInput.focus();
    }

    function handleFeedbackTileKeydown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openFeedbackModal();
        }
    }

    function handleFeedbackModalBackdropClick(event) {
        if (event.target === dom.feedbackModal) {
            closeFeedbackModal();
        }
    }

    async function rewriteFeedback() {
        const fields = getFeedbackFields();
        if (!fields.agentEmail || !fields.feedbackNotes) {
            setFeedbackStatus('Add the agent email and feedback notes before rewriting.', 'error');
            (fields.agentEmail ? dom.feedbackNotesInput : dom.feedbackAgentEmailInput).focus();
            return;
        }

        dom.rewriteFeedbackButton.disabled = true;
        dom.rewriteFeedbackButton.textContent = 'Rewriting...';
        setFeedbackStatus('Rewriting feedback with AI...');

        try {
            const result = await chat.createFeedbackCoachingDraft(fields);
            lastAiModel = result.model || '';
            lastAiOutput = result.content || '';
            dom.feedbackAiOutputInput.value = lastAiOutput;
            setFeedbackStatus('AI rewrite ready. Review and edit before saving.', 'success');
        } catch (error) {
            console.error('Feedback rewrite error:', error);
            setFeedbackStatus(error.message, 'error');
            onSystemMessage(`Feedback rewrite failed: ${error.message}`, 'error');
        } finally {
            dom.rewriteFeedbackButton.disabled = false;
            dom.rewriteFeedbackButton.textContent = 'Rewrite with AI';
        }
    }

    async function saveFeedback(event) {
        event.preventDefault();
        const fields = getFeedbackFields();
        const reviewedContent = dom.feedbackAiOutputInput.value.trim();

        if (!fields.agentEmail || !fields.feedbackNotes) {
            setFeedbackStatus('Add the agent email and feedback notes before saving.', 'error');
            (fields.agentEmail ? dom.feedbackNotesInput : dom.feedbackAgentEmailInput).focus();
            return;
        }

        if (!reviewedContent) {
            setFeedbackStatus('Rewrite the feedback or add reviewed coaching content before saving.', 'error');
            dom.feedbackAiOutputInput.focus();
            return;
        }

        dom.saveFeedbackButton.disabled = true;
        setFeedbackStatus('Saving feedback to PocketBase...');

        try {
            const record = await tasks.createFeedbackTask(buildFeedbackTask(fields, reviewedContent));
            onSystemMessage(`Feedback saved for ${fields.agentEmail}.`, 'success');
            setFeedbackStatus('Feedback saved.', 'success');
            renderKnowledgeFeedback();
            window.setTimeout(closeFeedbackModal, 500);
            return record;
        } catch (error) {
            console.error('Feedback save error:', error);
            setFeedbackStatus(error.message, 'error');
            onSystemMessage(`Feedback save failed: ${error.message}`, 'error');
            return null;
        } finally {
            dom.saveFeedbackButton.disabled = false;
        }
    }

    function buildFeedbackTask(fields, reviewedContent) {
        const timestamp = new Date().toISOString();
        const currentUser = getCurrentUser();
        const aiOutput = lastAiOutput || reviewedContent;
        return {
            task_name: `Feedback - ${fields.agentEmail} - ${fields.submissionType}`,
            task_description: reviewedContent,
            Notes: buildRawSubmissionNotes(fields),
            board_name: 'Feedback',
            task_status: 'new',
            task_id: Date.now(),
            Json: {
                source: FEEDBACK_SOURCE,
                feedback_type: fields.submissionType,
                agent_email: fields.agentEmail,
                original_fields: fields,
                ai_output: aiOutput,
                reviewed_output: reviewedContent,
                model: lastAiModel,
                submitted_at: timestamp,
                submitted_by: {
                    id: currentUser?.id || '',
                    email: currentUser?.email || '',
                    name: currentUser?.name || '',
                },
            },
        };
    }

    function buildRawSubmissionNotes(fields) {
        return [
            `Submission Type: ${fields.submissionType}`,
            `Agent Email: ${fields.agentEmail}`,
            `Action Taken:\n${fields.actionTaken || 'Not provided'}`,
            `Action Required:\n${fields.actionRequired || 'Not provided'}`,
            `Feedback Notes:\n${fields.feedbackNotes || 'Not provided'}`,
        ].join('\n\n');
    }

    function getFeedbackFields() {
        return {
            submissionType: dom.feedbackSubmissionTypeInput.value.trim() || 'General',
            actionTaken: dom.feedbackActionTakenInput.value.trim(),
            actionRequired: dom.feedbackActionRequiredInput.value.trim(),
            agentEmail: dom.feedbackAgentEmailInput.value.trim(),
            feedbackNotes: dom.feedbackNotesInput.value.trim(),
        };
    }

    function renderKnowledgeFeedback() {
        if (!dom.feedbackKnowledgeList) return;

        const feedbackTasks = tasks.getSavedTasks()
            .filter(isFeedbackTask)
            .sort((a, b) => new Date(getFeedbackTimestamp(b)).getTime() - new Date(getFeedbackTimestamp(a)).getTime());

        if (!feedbackTasks.length) {
            dom.feedbackKnowledgeList.innerHTML = '<div class="empty-state">No feedback submissions saved yet.</div>';
            return;
        }

        dom.feedbackKnowledgeList.innerHTML = feedbackTasks.map(renderFeedbackDocument).join('');
    }

    function renderFeedbackDocument(task) {
        const json = parseTaskJson(task.Json);
        const fields = json.original_fields || {};
        const sections = splitFeedbackSections(task.task_description || json.reviewed_output || json.ai_output || '');
        return `
        <article class="feedback-document">
            <header class="feedback-document-header">
                <div>
                    <p class="eyebrow">Feedback Document</p>
                    <h3>${escapeHtml(task.task_name || 'Feedback Submission')}</h3>
                </div>
                <span class="chip">${escapeHtml(fields.submissionType || json.feedback_type || 'General')}</span>
            </header>
            <dl class="feedback-document-meta">
                <div><dt>Agent</dt><dd>${escapeHtml(fields.agentEmail || json.agent_email || 'Not provided')}</dd></div>
                <div><dt>Status</dt><dd>${escapeHtml(task.task_status || 'new')}</dd></div>
                <div><dt>Saved</dt><dd>${escapeHtml(formatDateTime(getFeedbackTimestamp(task)))}</dd></div>
            </dl>
            <div class="feedback-document-body">
                ${sections.map(section => `
                    <section>
                        <h4>${escapeHtml(section.title)}</h4>
                        <p>${escapeHtml(section.body || 'Not provided')}</p>
                    </section>
                `).join('')}
            </div>
        </article>
    `;
    }

    function isFeedbackTask(task) {
        return parseTaskJson(task.Json)?.source === FEEDBACK_SOURCE;
    }

    function getFeedbackTimestamp(task) {
        const json = parseTaskJson(task.Json);
        return json.submitted_at || task.created || task.updated || '';
    }

    function splitFeedbackSections(content) {
        const text = String(content || '').trim();
        if (!text) {
            return [{ title: 'Feedback', body: '' }];
        }

        const headings = [
            'Summary',
            'Observed Issue or Positive Behaviour',
            'Impact',
            'Coaching Guidance',
            'Action Required',
            'Suggested Follow-up',
        ];
        const escapedHeadings = headings.map(escapeRegExp).join('|');
        const headingPattern = new RegExp(`(?:^|\\n)(${escapedHeadings})\\s*:?\\s*\\n`, 'g');
        const matches = [...text.matchAll(headingPattern)];

        if (!matches.length) {
            return [{ title: 'Feedback', body: text }];
        }

        return matches.map((match, index) => {
            const bodyStart = match.index + match[0].length;
            const nextMatch = matches[index + 1];
            const bodyEnd = nextMatch ? nextMatch.index : text.length;
            return {
                title: match[1],
                body: text.slice(bodyStart, bodyEnd).trim(),
            };
        });
    }

    function escapeRegExp(value) {
        return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function setFeedbackStatus(message, type = '') {
        dom.feedbackStatus.textContent = message;
        dom.feedbackStatus.classList.remove('success', 'error');
        if (type) dom.feedbackStatus.classList.add(type);
    }

    return {
        openFeedbackModal,
        closeFeedbackModal,
        clearFeedbackForm,
        handleFeedbackTileKeydown,
        handleFeedbackModalBackdropClick,
        rewriteFeedback,
        saveFeedback,
        renderKnowledgeFeedback,
        DEFAULT_AI_OUTPUT_PLACEHOLDER,
    };
}

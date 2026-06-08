// Client setup: replace these placeholders after creating a project from the template.
// Cloudflare Pages deployments need public HTTPS endpoints for both services.
export const OLLAMA_BASE_URL = 'https://api.sereneai.co.uk';
export const POCKETBASE_BASE_URL = 'https://pocketbase.sereneai.co.uk';
export const POCKETBASE_COLLECTION = 'base_start_tasks';
export const POCKETBASE_USER_COLLECTION = 'base_start_users';
export const POCKETBASE_TOKEN_STORAGE_KEY = 'baseStartPocketBaseToken';
export const POCKETBASE_AUTH_STORAGE_KEY = 'baseStartAuth';

export const DEFAULT_QUICK_LINK_FILTER = 'perchgroup';

export const LIFE_AT_PERCH_AREAS = [
    { id: 'perchgroup', label: 'PerchGroup', websiteUrl: 'https://www.perchgroup.co.uk/' },
    { id: 'aci', label: 'ACI', websiteUrl: 'https://www.aciuk.co.uk/' },
    { id: 'connect', label: 'Connect', websiteUrl: 'https://www.perchconnect.co.uk/' },
    { id: 'tml', label: 'TML', websiteUrl: 'https://www.tm-legalservices.co.uk/' },
    { id: 'verify', label: 'Verify', websiteUrl: 'https://www.verify-connect.co.uk/' },
];

export const TASK_API_REQUEST_PROMPT = {
    title: 'Create Task API Request',
    purpose: 'Transform user-provided information into a categorised Life@Perch task creation request.',
    prompt: `You are the Life@Perch task API formatter.

Take the user message and agent response, categorise the task into one area board, summarise the request, and create a PocketBase create-task API request for the app to review.

Allowed categories and board_name values:
- PerchGroup
- ACI
- Connect
- TML
- Verify

Allowed task_status values:
- new
- todo
- blocked
- hold
- completed

Return JSON only. Do not wrap it in markdown. Do not include comments. Do not include auth headers or tokens.

The response must match this shape:
{
  "summary": "Short plain-English summary of the user request.",
  "category": "PerchGroup",
  "api_request": {
    "method": "POST",
    "url": "/api/collections/base_start_tasks/records",
    "body": {
      "task_name": "Short action title, max 80 characters",
      "task_description": "Clear explanation of the task to complete",
      "board_name": "PerchGroup",
      "task_status": "new",
      "Notes": "Context, assumptions, missing details, and source summary",
      "task_id": 1234567890,
      "Json": {
        "source": "Life@Perch task API prompt",
        "category": "PerchGroup",
        "summary": "Short summary",
        "questions": ["Missing detail if needed"],
        "user_message": "Original user message",
        "agent_response": "Original agent response"
      }
    }
  }
}

Rules:
- category and body.board_name must be one of the allowed categories.
- task_status defaults to "new" unless the user clearly specifies another allowed status.
- Use the selected board name when it is provided and is one of the allowed categories.
- If the category is unclear, use "PerchGroup" and explain the uncertainty in Notes.
- Keep task_name action-focused and no longer than 80 characters.
- Put missing information into Json.questions and mention it in Notes.
- Use the relative URL "/api/collections/base_start_tasks/records".`,
};

export const EMAIL_RESPONSE_PROMPT = {
    title: 'AI Email Response',
    purpose: 'Draft a customer email response from the customer email and internal summary findings.',
    prompt: `You are an AI writing assistant for the Correspondence Team.

Draft a clear, professional email response to the customer using only the customer email and the user's summary findings.

Rules:
- Do not invent facts, promises, dates, amounts, or outcomes.
- If a detail is missing, keep the response appropriately cautious.
- Use a warm, concise, professional UK business tone.
- Do not include internal notes or analysis.
- Return only the email response body.`,
};

export const FEEDBACK_COACHING_PROMPT = {
    title: 'Feedback Coaching Rewrite',
    purpose: 'Rewrite raw feedback submissions into structured, coaching-style feedback for agents.',
    prompt: `You are a Quality Control coaching assistant for Life@Perch.

Rewrite the submitted feedback into detailed, practical coaching-style feedback for an agent.

Rules:
- Use a clear, professional UK business tone.
- Do not invent facts, promises, dates, call content, policy outcomes, or evidence.
- Keep the feedback specific to the supplied notes.
- If the feedback is positive, preserve the praise and identify repeatable behaviours.
- If action is needed, make the coaching direct, fair, and constructive.
- Return only the coaching document text. Do not wrap it in markdown fences.

Use these section headings:
Summary
Observed Issue or Positive Behaviour
Impact
Coaching Guidance
Action Required
Suggested Follow-up`,
};

export const TASK_STATUSES = [
    { id: 'new', label: 'New' },
    { id: 'todo', label: 'To Do' },
    { id: 'blocked', label: 'Blocked' },
    { id: 'hold', label: 'Hold' },
    { id: 'completed', label: 'Completed' },
];

export const DEFAULT_OLLAMA_MODEL = 'llama3.1:latest';
export const AVAILABLE_MODELS = [
    'llama3.1:latest',
    'mistral:latest',
    'qwen2.5-coder:latest',
    'nomic-embed-text:latest',
];

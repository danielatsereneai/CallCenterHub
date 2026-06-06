// Client setup: replace these placeholders after creating a project from the template.
// Cloudflare Pages deployments need public HTTPS endpoints for both services.
export const OLLAMA_BASE_URL = 'https://ollama-gateway.example.com';
export const POCKETBASE_BASE_URL = 'https://pocketbase.example.com';
export const POCKETBASE_COLLECTION = 'base_start_tasks';
export const POCKETBASE_USER_COLLECTION = 'base_start_users';
export const POCKETBASE_TOKEN_STORAGE_KEY = 'baseStartPocketBaseToken';
export const POCKETBASE_AUTH_STORAGE_KEY = 'baseStartAuth';

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

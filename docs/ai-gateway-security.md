# AI Gateway Security

Life@Perch sends agent chat, task-drafting context, feedback notes, customer email text, and internal summary findings from the browser to the configured Ollama-compatible gateway.

Do not release AI features for a client until the gateway owner has approved and documented:

- Authentication or network restrictions for `/api/tags` and `/api/chat`.
- Allowed browser origins.
- Rate limits and abuse monitoring.
- Whether prompts, responses, IP addresses, and user identifiers are logged.
- Log retention and deletion process.
- Whether customer data, agent email addresses, and quality feedback may be sent to the gateway.
- Who can administer models and gateway configuration.
- Incident response for accidental sensitive-data submission.

The browser app only calls:

```txt
GET /api/tags
POST /api/chat
```

The gateway should not expose model administration, filesystem access, raw local Ollama endpoints beyond those two routes, or any PocketBase superuser token.

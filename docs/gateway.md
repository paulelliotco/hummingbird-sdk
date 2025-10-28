# Gateway

Enterprise gateway server with SSO, audit logs, secrets management, and OpenTelemetry.

## Quick Start

### Installation

```bash
npm install @hummingbird/gateway
```

### Running

```bash
# Using environment variables
export GATEWAY_PORT=3000
export AUTH_ENABLED=true
export API_KEYS=key1,key2

npx hummingbird-gateway
```

Or programmatically:

```typescript
import { startServer, loadConfig } from '@hummingbird/gateway';

const config = loadConfig();
await startServer(config);
```

## Configuration

Set via environment variables:

### Server

- `GATEWAY_PORT` - Port (default: 3000)
- `GATEWAY_HOST` - Host (default: 0.0.0.0)

### Authentication

- `AUTH_ENABLED` - Enable auth (default: false)
- `API_KEYS` - Comma-separated API keys
- `JWT_SECRET` - JWT secret for tokens
- `SSO_ENABLED` - Enable SSO (default: false)
- `SSO_PROVIDER` - SSO provider (okta, saml)
- `SSO_ISSUER` - SSO issuer URL
- `SSO_CLIENT_ID` - SSO client ID
- `SSO_CLIENT_SECRET` - SSO client secret

### Policy

- `POLICY_ENABLED` - Enable policies (default: true)
- `DEFAULT_POLICY` - Default policy (strict, default, permissive)

### Secrets

- `SECRETS_VAULT` - Vault type (env, file, aws, gcp)
- `SECRETS_PATH` - Vault path
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `GEMINI_API_KEY` - Gemini API key

### Audit

- `AUDIT_ENABLED` - Enable audit logs (default: true)
- `AUDIT_STORAGE` - Storage type (file, database)
- `AUDIT_PATH` - Log file path (default: ./logs/audit.log)

### OpenTelemetry

- `OTEL_ENABLED` - Enable OTel (default: false)
- `OTEL_ENDPOINT` - OTel collector endpoint
- `OTEL_SERVICE_NAME` - Service name (default: hummingbird-gateway)

### Rate Limiting

- `RATE_LIMIT_ENABLED` - Enable rate limiting (default: false)
- `RATE_LIMIT_MAX` - Max requests per minute (default: 60)

### CORS

- `CORS_ENABLED` - Enable CORS (default: true)
- `CORS_ORIGINS` - Allowed origins (comma-separated, default: *)

## API Endpoints

### POST /v1/execute

Execute an agent request.

**Headers:**
- `X-API-Key` or `Authorization: Bearer <token>`

**Body:**
```json
{
  "provider": "openai",
  "model": "gpt-4",
  "messages": [...],
  "tools": [...],
  "options": {...}
}
```

**Response:**
```json
{
  "sessionId": "session_123",
  "status": "accepted"
}
```

### GET /v1/policy

Get current policy.

**Response:**
```json
{
  "rules": [
    { "tool": "File.read", "action": "allow" },
    { "tool": "*", "action": "ask" }
  ]
}
```

### GET /v1/threads

List threads for authenticated user.

**Response:**
```json
{
  "threads": [
    {
      "id": "thread_123",
      "createdBy": "user_456",
      "visibility": "private"
    }
  ]
}
```

### GET /v1/audit

Get audit logs (admin only).

**Response:**
```json
{
  "logs": [
    {
      "timestamp": "2025-10-28T10:00:00Z",
      "userId": "user_123",
      "eventType": "execution",
      "action": "agent.send",
      "result": "success"
    }
  ]
}
```

## Authentication

### API Key

```bash
curl -H "X-API-Key: your-key" http://localhost:3000/v1/execute
```

### JWT Bearer Token

```bash
curl -H "Authorization: Bearer your-jwt" http://localhost:3000/v1/execute
```

### SSO

Configure Okta or SAML provider in environment variables.

## Policies

The gateway enforces workspace-specific policies:

```typescript
import { PolicyManager } from '@hummingbird/gateway';

const manager = new PolicyManager(config);

// Load workspace policy
manager.loadWorkspacePolicy('workspace-123', {
  version: '1.0',
  rules: [
    { tool: 'Bash', action: 'reject' },
    { tool: 'File.*', action: 'allow' },
  ],
});
```

## Secrets Management

Provider API keys are managed securely:

```typescript
import { SecretsManager } from '@hummingbird/gateway';

const secrets = new SecretsManager(config);

// Get provider key for workspace
const key = await secrets.getProviderKey('openai', 'workspace-123');

// Set provider key
await secrets.setProviderKey('anthropic', 'sk-...', 'workspace-123');
```

## Audit Logging

All actions are logged:

```typescript
import { AuditLogger } from '@hummingbird/gateway';

const audit = new AuditLogger(config);

await audit.logExecution(authContext, 'openai', 'gpt-4', true, {
  tokens: 1000,
});
```

## OpenTelemetry

Export traces to any OTel-compatible backend:

```bash
export OTEL_ENABLED=true
export OTEL_ENDPOINT=http://localhost:4318/v1/traces
```

Traces include:
- Agent execution spans
- LLM call spans
- Tool execution spans
- Token usage metrics

## IP Allow-listing

Configure allowed IP addresses per workspace:

```typescript
import { PolicyManager } from '@hummingbird/gateway';

const policy = new PolicyManager(config);

if (!policy.isIPAllowed(request.ip, authContext)) {
  reply.code(403).send({ error: 'IP not allowed' });
}
```

## Zero Data Retention

Enable zero data retention mode:

```bash
export ZERO_RETENTION=true
```

Or per workspace:

```bash
export WORKSPACE_123_ZERO_RETENTION=true
```

## Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["node", "packages/gateway/dist/cli.js"]
```

### Kubernetes

```yaml
apiVersion: v1
kind: Service
metadata:
  name: hummingbird-gateway
spec:
  ports:
  - port: 3000
  selector:
    app: hummingbird-gateway
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hummingbird-gateway
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: gateway
        image: hummingbird-gateway:latest
        env:
        - name: AUTH_ENABLED
          value: "true"
        - name: OTEL_ENABLED
          value: "true"
```


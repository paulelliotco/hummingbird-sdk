/**
 * Gateway server
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import type { GatewayConfig } from './config.js';
import { createAuthMiddleware } from './auth.js';
import { createPolicyManager } from './policy.js';
import { createSecretsManager } from './secrets.js';
import { createAuditLogger } from './audit.js';
import { setupOTelExporter } from './otel.js';

export async function createServer(config: GatewayConfig) {
  const fastify = Fastify({
    logger: true,
  });

  // CORS
  if (config.cors.enabled) {
    await fastify.register(cors, {
      origin: config.cors.origins,
    });
  }

  // Initialize subsystems
  const auth = createAuthMiddleware(config);
  const policy = createPolicyManager(config);
  const secrets = createSecretsManager(config);
  const audit = createAuditLogger(config);
  
  // Setup OTel if enabled
  const otelExporter = setupOTelExporter(config);

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Execute agent request
  fastify.post('/v1/execute', async (request, reply) => {
    const authContext = await auth.authenticate(request, reply);
    if (!authContext) return;

    await audit.logAuth(authContext, true);

    const body = request.body as any;
    const { provider, model, messages, tools } = body;

    // Get policy engine
    const policyEngine = policy.getEngine(authContext);

    // Check IP allow-list
    if (!policy.isIPAllowed(request.ip, authContext)) {
      reply.code(403).send({ error: 'IP not allowed' });
      return;
    }

    // Get provider API key
    const apiKey = await secrets.getProviderKey(provider, authContext.workspaceId);
    if (!apiKey) {
      reply.code(500).send({ error: 'Provider API key not configured' });
      return;
    }

    await audit.logExecution(authContext, provider, model, true);

    // Return execution details (actual execution would happen here)
    return {
      sessionId: `session_${Date.now()}`,
      status: 'accepted',
      message: 'Agent execution would start here',
    };
  });

  // Get policy
  fastify.get('/v1/policy', async (request, reply) => {
    const authContext = await auth.authenticate(request, reply);
    if (!authContext) return;

    const policyEngine = policy.getEngine(authContext);
    return {
      rules: policyEngine.getRules(),
    };
  });

  // List threads
  fastify.get('/v1/threads', async (request, reply) => {
    const authContext = await auth.authenticate(request, reply);
    if (!authContext) return;

    return {
      threads: [],
      message: 'Thread listing would be implemented here',
    };
  });

  // Get audit logs
  fastify.get('/v1/audit', async (request, reply) => {
    const authContext = await auth.authenticate(request, reply);
    if (!authContext) return;

    // Check if user has admin role
    if (!authContext.roles.includes('admin')) {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }

    return {
      logs: [],
      message: 'Audit log retrieval would be implemented here',
    };
  });

  return fastify;
}

export async function startServer(config: GatewayConfig) {
  const server = await createServer(config);
  
  try {
    await server.listen({ port: config.port, host: config.host });
    console.log(`Gateway server listening on ${config.host}:${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }

  return server;
}


#!/usr/bin/env node
/**
 * Gateway CLI entry point
 */

import { config } from 'dotenv';
import { loadConfig } from './config.js';
import { startServer } from './server.js';

// Load environment variables
config();

async function main() {
  console.log('Starting Hummingbird Gateway...');
  
  const gatewayConfig = loadConfig();
  
  console.log('Configuration loaded:');
  console.log(`  Port: ${gatewayConfig.port}`);
  console.log(`  Host: ${gatewayConfig.host}`);
  console.log(`  Auth: ${gatewayConfig.auth.enabled ? 'enabled' : 'disabled'}`);
  console.log(`  Policy: ${gatewayConfig.policy.enabled ? 'enabled' : 'disabled'}`);
  console.log(`  Audit: ${gatewayConfig.audit.enabled ? 'enabled' : 'disabled'}`);
  console.log(`  OTel: ${gatewayConfig.otel.enabled ? 'enabled' : 'disabled'}`);
  
  await startServer(gatewayConfig);
}

main().catch((error) => {
  console.error('Failed to start gateway:', error);
  process.exit(1);
});


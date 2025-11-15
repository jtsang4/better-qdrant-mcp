#!/usr/bin/env node
import { QdrantMCPServer } from './server';

// Export for library usage - MCP server only (dense search)
export { QdrantMCPServer };

// Main execution
async function main(): Promise<void> {
  const server = new QdrantMCPServer();
  await server.run();
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

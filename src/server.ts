#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import OpenAI from 'openai';
import { QdrantHttpClient } from './client';
import { DefaultToolRegistry, type ToolContext } from './tools';

// Main MCP Server
export class QdrantMCPServer {
  private server: McpServer;
  private qdrantClient: QdrantHttpClient;
  private openai: OpenAI;
  private defaultCollection?: string;
  private toolRegistry: DefaultToolRegistry;

  constructor() {
    // Initialize configuration first
    const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
    const qdrantApiKey = process.env.QDRANT_API_KEY;
    const defaultCollection = process.env.COLLECTION_NAME;

    const openaiApiKey =
      process.env.OPENAPI_API_KEY || process.env.OPENAI_API_KEY;
    const openaiBaseUrl = process.env.OPENAI_BASE_URL;

    if (!openaiApiKey) {
      throw new Error(
        'OpenAI API key is required (OPENAPI_API_KEY or OPENAI_API_KEY)',
      );
    }

    this.server = new McpServer({
      name: 'qdrant-mcp-server',
      version: '1.0.0',
    });

    this.qdrantClient = new QdrantHttpClient({
      url: qdrantUrl,
      apiKey: qdrantApiKey,
      defaultCollection: defaultCollection,
    });

    this.openai = new OpenAI({
      apiKey: openaiApiKey,
      baseURL: openaiBaseUrl,
    });

    this.defaultCollection = defaultCollection;

    // Initialize tool registry
    this.toolRegistry = DefaultToolRegistry.create(this.defaultCollection);

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // Create tool context for the handlers
    const toolContext: ToolContext = {
      qdrantClient: this.qdrantClient,
      openai: this.openai,
      defaultCollection: this.defaultCollection,
    };

    // Setup all tools using the registry
    this.toolRegistry.setupHandlers(this.server, toolContext);
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Qdrant MCP Server running on stdio');
  }
}

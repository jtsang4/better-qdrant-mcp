import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type OpenAI from 'openai';
import type { z } from 'zod';
import type { QdrantHttpClient } from '../client';

export interface ToolContext {
  qdrantClient: QdrantHttpClient;
  openai: OpenAI;
  defaultCollection?: string;
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  handler: (args: unknown, context: ToolContext) => Promise<CallToolResult>;
}

export interface ToolRegistry {
  tools: Tool[];
  registerTool(tool: Tool): void;
  getTools(): Tool[];
  setupHandlers(server: unknown, context: ToolContext): void;
}

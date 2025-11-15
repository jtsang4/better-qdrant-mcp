import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { MemoryStoreArgs, PointPayload } from '../types';
import type { Tool, ToolContext } from './types';

export function createMemoryStoreTool(): Tool {
  const inputSchema = (defaultCollection?: string) =>
    z.object({
      information: z
        .string()
        .describe(
          'The main text content you want to store as long-term memory (e.g. notes, facts, documentation snippets). Use clear, self-contained sentences.',
        ),
      metadata: z
        .record(z.any())
        .optional()
        .describe(
          'Optional JSON metadata describing this information, such as {"source": "docs", "url": "...", "tags": ["project", "user-pref"]}. Include anything that helps future filtering.',
        ),
      ...(defaultCollection
        ? {}
        : {
            collection_name: z
              .string()
              .describe(
                'Name of the memory collection to store this information in. If you are unsure, ask the user or use a general-purpose collection name (e.g. "long_term_memory").',
              ),
          }),
    });

  return {
    name: 'memory-store',
    description:
      'Store long-term textual information in the underlying vector memory store. Use this when you want the assistant to remember something for future retrieval (not for immediate reasoning). Automatically embeds the text and returns the stored ID.',
    inputSchema: inputSchema(),
    handler: async (
      args: unknown,
      context: ToolContext,
    ): Promise<CallToolResult> => {
      try {
        const { information, metadata, collection_name } = (args ?? {}) as {
          information: string;
          metadata?: Record<string, unknown>;
          collection_name?: string;
        };
        const storeArgs: MemoryStoreArgs = {
          information,
          metadata,
          collection_name: context.defaultCollection || collection_name,
        };
        return await handleStore(storeArgs, context);
      } catch (error) {
        const result: CallToolResult = {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
        return result;
      }
    },
  };
}

async function handleStore(
  args: MemoryStoreArgs,
  context: ToolContext,
): Promise<CallToolResult> {
  const collectionName = args.collection_name || context.defaultCollection;
  if (!collectionName) {
    throw new Error('Collection name is required');
  }

  // Generate embedding for the information
  const embeddingResponse = await context.openai.embeddings.create({
    model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    input: args.information,
  });

  const embedding = embeddingResponse.data[0].embedding;

  // Create collection with a single dense vector if it doesn't exist
  await context.qdrantClient.createCollection(collectionName, embedding.length);

  // Generate a unique ID for the point
  const pointId = Date.now().toString();

  // Store the point with metadata
  const payload: PointPayload = {
    information: args.information,
    stored_at: new Date().toISOString(),
  };

  if (args.metadata) {
    payload.metadata = args.metadata;
  }

  await context.qdrantClient.upsertPoints(collectionName, [
    {
      id: pointId,
      vector: embedding,
      payload: payload,
    },
  ]);

  return {
    content: [
      {
        type: 'text' as const,
        text: `Information stored successfully in collection '${collectionName}' with ID: ${pointId}`,
      },
    ],
  };
}

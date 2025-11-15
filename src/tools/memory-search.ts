import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { MemorySearchArgs, SearchResult } from '../types';
import type { Tool, ToolContext } from './types';

export function createMemorySearchTool(): Tool {
  const inputSchema = (defaultCollection?: string) =>
    z.object({
      query: z
        .string()
        .describe(
          'Natural language query describing what previously stored information you want to retrieve (e.g. "user preferences about notifications", "project X architecture notes").',
        ),
      limit: z
        .number()
        .optional()
        .default(5)
        .describe(
          'Maximum number of results to return. Default: 5. Increase only if you truly need more context, to avoid overwhelming the conversation.',
        ),
      ...(defaultCollection
        ? {}
        : {
            collection_name: z
              .string()
              .describe(
                'Name of the memory collection to search in. Must match the collection where the information was stored.',
              ),
          }),
    });

  return {
    name: 'memory-search',
    description:
      'Retrieve relevant information previously stored in vector memory using semantic (dense) search. Use this as a memory lookup to fetch past notes, facts, or documents related to the current query.',
    inputSchema: inputSchema(),
    handler: async (
      args: unknown,
      context: ToolContext,
    ): Promise<CallToolResult> => {
      try {
        const { query, limit, collection_name } = (args ?? {}) as {
          query: string;
          limit?: number;
          collection_name?: string;
        };
        const findArgs: MemorySearchArgs = {
          query,
          collection_name: context.defaultCollection || collection_name,
          limit,
        };
        return await handleFind(findArgs, context);
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

async function handleFind(
  args: MemorySearchArgs,
  context: ToolContext,
): Promise<CallToolResult> {
  const collectionName = args.collection_name || context.defaultCollection;
  if (!collectionName) {
    throw new Error('Collection name is required');
  }

  // Generate embedding for the query
  const embeddingResponse = await context.openai.embeddings.create({
    model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    input: args.query,
  });

  const queryVector = embeddingResponse.data[0].embedding;

  // Search for similar points using dense vectors
  const results: SearchResult[] = await context.qdrantClient.searchPoints(
    collectionName,
    queryVector,
    args.limit ?? 5,
  );

  if (results.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `No relevant information found for query: "${args.query}"`,
        },
      ],
    };
  }

  // Format the results
  const formattedResults = results.map((result, index) => {
    const score = result.score || 0;
    const payload = result.payload || {};

    let response = `Result ${index + 1} (Score: ${score.toFixed(4)}):\n`;

    // Debug: Show payload structure for troubleshooting
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_QDRANT) {
      response += `Debug - Payload keys: ${Object.keys(payload).join(', ')}\n`;
    }

    response += `Detail: ${JSON.stringify(payload)}\n`;

    return response;
  });

  return {
    content: formattedResults.map((result) => ({
      type: 'text' as const,
      text: result,
    })),
  };
}

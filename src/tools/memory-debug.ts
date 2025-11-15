import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type {
  MemoryDebugArgs,
  QdrantCollectionInfo,
  QdrantScrollResponse,
} from '../types';
import type { Tool, ToolContext } from './types';

export function createMemoryDebugTool(): Tool {
  const inputSchema = (defaultCollection?: string) =>
    z.object({
      ...(defaultCollection
        ? {}
        : {
            collection_name: z
              .string()
              .describe(
                'Name of the memory collection to inspect and debug (for diagnostics, not for normal QA).',
              ),
          }),
    });

  return {
    name: 'memory-debug',
    description:
      'Debug/inspection tool for memory collections. Use only when you need to understand the index structure or sample stored points (schema, payload keys, example payloads) for troubleshooting or explaining the memory layout.',
    inputSchema: inputSchema(),
    handler: async (
      args: unknown,
      context: ToolContext,
    ): Promise<CallToolResult> => {
      try {
        const { collection_name } = (args ?? {}) as {
          collection_name?: string;
        };
        const debugArgs: MemoryDebugArgs = {
          collection_name: context.defaultCollection || collection_name,
        };
        return await handleDebug(debugArgs, context);
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

async function handleDebug(
  args: MemoryDebugArgs,
  context: ToolContext,
): Promise<CallToolResult> {
  const collectionName = args.collection_name || context.defaultCollection;
  if (!collectionName) {
    throw new Error('Collection name is required');
  }

  try {
    // Get collection info
    const collectionInfo = await context.qdrantClient.makeRequest(
      `/collections/${collectionName}`,
    );
    const info = (await collectionInfo.json()) as {
      result: QdrantCollectionInfo;
    };

    // Get some sample points
    const sampleResponse = await context.qdrantClient.makeRequest(
      `/collections/${collectionName}/points/scroll`,
      {
        method: 'POST',
        body: JSON.stringify({
          limit: 5,
          with_payload: true,
          with_vector: false,
        }),
      },
    );

    const sampleData = (await sampleResponse.json()) as QdrantScrollResponse;

    let debugInfo = `Collection Info for "${collectionName}":\n`;
    debugInfo += JSON.stringify(info.result, null, 2);
    debugInfo += `\n\nSample Data (first ${sampleData.result?.points?.length || 0} points):\n`;

    if (sampleData.result?.points) {
      sampleData.result.points.forEach((point, index: number) => {
        debugInfo += `\n--- Point ${index + 1} (ID: ${point.id}) ---\n`;
        debugInfo += `Payload keys: ${Object.keys(point.payload || {}).join(', ')}\n`;
        debugInfo += `Payload: ${JSON.stringify(point.payload, null, 2)}\n`;
      });
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: debugInfo,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Debug error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}

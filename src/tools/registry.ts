import { createMemoryDebugTool } from './memory-debug';
import { createMemorySearchTool } from './memory-search';
import { createMemoryStoreTool } from './memory-store';
import type { Tool, ToolContext, ToolRegistry } from './types';

export class DefaultToolRegistry implements ToolRegistry {
  tools: Tool[] = [];

  registerTool(tool: Tool): void {
    this.tools.push(tool);
  }

  getTools(): Tool[] {
    return [...this.tools];
  }

  setupHandlers(server: unknown, context: ToolContext): void {
    const mcpServer = server as {
      registerTool: (
        name: string,
        meta: { description: string; inputSchema: unknown },
        handler: (args: unknown, extra: unknown) => Promise<unknown>,
      ) => void;
    };

    this.tools.forEach((tool) => {
      mcpServer.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: tool.inputSchema,
        },
        async (args: unknown, _extra: unknown) => {
          return tool.handler(args, context);
        },
      );
    });
  }

  static create(_defaultCollection?: string): ToolRegistry {
    const registry = new DefaultToolRegistry();

    // Register all tools
    registry.registerTool(createMemoryStoreTool());
    registry.registerTool(createMemorySearchTool());
    registry.registerTool(createMemoryDebugTool());

    return registry;
  }
}

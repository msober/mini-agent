import { LLMClient } from '../llm/client.js';
import { Conversation } from '../core/conversation.js';
import { ToolRegistry } from '../tools/registry.js';
import type { Tool } from '../tools/types.js';
import type { SubagentConfig, SubagentResult } from './types.js';

export class WorkerAgent {
  private config: SubagentConfig;
  private client: LLMClient;
  private tools: ToolRegistry;
  private availableTools: Map<string, Tool>;

  constructor(config: SubagentConfig, availableTools: Map<string, Tool>) {
    this.config = config;
    this.client = new LLMClient();
    this.tools = new ToolRegistry();
    this.availableTools = availableTools;

    // Register only the tools this subagent is allowed to use
    this.registerAllowedTools();
  }

  private registerAllowedTools(): void {
    if (this.config.tools && this.config.tools.length > 0) {
      // Register only specified tools
      for (const toolName of this.config.tools) {
        const tool = this.availableTools.get(toolName);
        if (tool) {
          this.tools.register(tool);
        }
      }
    } else {
      // Register all available tools
      for (const tool of this.availableTools.values()) {
        this.tools.register(tool);
      }
    }
  }

  async execute(task: string, maxIterations: number = 10): Promise<SubagentResult> {
    const conversation = new Conversation(this.config.systemPrompt);
    conversation.addUser(task);

    let iterations = 0;

    while (iterations < maxIterations) {
      iterations++;

      try {
        const response = await this.client.chatWithTools(
          conversation.getMessages(),
          this.tools.getDefinitions()
        );

        // If there are tool calls, execute them
        if (response.toolCalls && response.toolCalls.length > 0) {
          conversation.addAssistantWithToolCalls(response.toolCalls);

          for (const toolCall of response.toolCalls) {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              const result = await this.tools.execute(toolCall.function.name, args);
              conversation.addToolResult(toolCall.id, result);
            } catch (error) {
              const errorMsg = `Error: ${(error as Error).message}`;
              conversation.addToolResult(toolCall.id, errorMsg);
            }
          }

          continue;
        }

        // No tool calls, we have a final response
        return {
          success: true,
          output: response.content || '',
        };
      } catch (error) {
        return {
          success: false,
          output: '',
          error: (error as Error).message,
        };
      }
    }

    return {
      success: false,
      output: '',
      error: `Max iterations (${maxIterations}) reached`,
    };
  }
}

import chalk from 'chalk';
import { LLMClient } from '../llm/client.js';
import { Conversation } from './conversation.js';
import { ToolRegistry } from '../tools/registry.js';
import { MCPServerManager } from '../mcp/server.js';
import { loadMCPConfig } from '../config/env.js';
import { SubagentManager, createSubagentTool } from '../subagent/index.js';
import type { Tool } from '../tools/types.js';
import type { MCPServerConfig } from '../mcp/types.js';
import type { SubagentConfig } from '../subagent/types.js';

export class Agent {
  private client: LLMClient;
  private conversation: Conversation;
  private tools: ToolRegistry;
  private mcpManager: MCPServerManager;
  private subagentManager: SubagentManager;

  constructor(systemPrompt: string) {
    this.client = new LLMClient();
    this.conversation = new Conversation(systemPrompt);
    this.tools = new ToolRegistry();
    this.mcpManager = new MCPServerManager();
    this.subagentManager = new SubagentManager();
  }

  registerTool(tool: Tool): void {
    this.tools.register(tool);
  }

  registerSubagent(config: SubagentConfig): void {
    this.subagentManager.registerSubagent(config);
  }

  initializeSubagents(): void {
    // Pass available tools to subagent manager
    this.subagentManager.setAvailableTools(this.tools.getToolsMap());
    // Register the delegate_task tool
    const delegateTool = createSubagentTool(this.subagentManager);
    this.tools.register(delegateTool);
  }

  listSubagents(): string[] {
    return this.subagentManager.getSubagentNames();
  }

  async addMCPServer(config: MCPServerConfig): Promise<void> {
    await this.mcpManager.addServer(config);
    // Register MCP tools
    const mcpTools = await this.mcpManager.getAllTools();
    for (const tool of mcpTools) {
      if (!this.tools.has(tool.definition.name)) {
        this.tools.register(tool);
      }
    }
    console.log(chalk.green(`MCP server connected: ${config.name}`));
  }

  async removeMCPServer(name: string): Promise<void> {
    await this.mcpManager.removeServer(name);
  }

  listMCPServers(): string[] {
    return this.mcpManager.listServers();
  }

  async loadMCPServers(): Promise<void> {
    const configs = loadMCPConfig();
    for (const config of configs) {
      try {
        await this.addMCPServer(config);
      } catch (error) {
        console.error(chalk.red(`Failed to connect MCP server ${config.name}:`), error);
      }
    }
  }

  async run(userInput: string): Promise<string> {
    this.conversation.addUser(userInput);

    while (true) {
      const response = await this.client.chatWithTools(
        this.conversation.getMessages(),
        this.tools.getDefinitions()
      );

      // If there are tool calls, execute them
      if (response.toolCalls && response.toolCalls.length > 0) {
        // Add assistant message with tool calls
        this.conversation.addAssistantWithToolCalls(response.toolCalls);

        // Execute each tool call
        for (const toolCall of response.toolCalls) {
          console.log(chalk.yellow(`\n[Tool: ${toolCall.function.name}]`));

          try {
            const args = JSON.parse(toolCall.function.arguments);
            console.log(chalk.gray(JSON.stringify(args, null, 2)));

            const result = await this.tools.execute(toolCall.function.name, args);

            // Show truncated result
            const displayResult = result.length > 500
              ? result.substring(0, 500) + '...(truncated)'
              : result;
            console.log(chalk.gray(displayResult));

            // Add tool result to conversation
            this.conversation.addToolResult(toolCall.id, result);
          } catch (error) {
            const errorMsg = `Error: ${(error as Error).message}`;
            console.log(chalk.red(errorMsg));
            this.conversation.addToolResult(toolCall.id, errorMsg);
          }
        }

        // Continue the loop to get the next response
        continue;
      }

      // No tool calls, we have a final response
      const content = response.content || '';
      this.conversation.addAssistant(content);
      return content;
    }
  }

  getConversation(): Conversation {
    return this.conversation;
  }

  async shutdown(): Promise<void> {
    await this.mcpManager.disconnectAll();
  }
}

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { MCPServerConfig, MCPTool } from './types.js';
import type { Tool } from '../tools/types.js';

export class MCPClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;
  private serverName: string;
  private connected: boolean = false;

  constructor(config: MCPServerConfig) {
    this.serverName = config.name;
    this.client = new Client(
      { name: 'mini-agent', version: '1.0.0' },
      { capabilities: {} }
    );
  }

  async connect(config: MCPServerConfig): Promise<void> {
    this.transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: { ...process.env, ...config.env } as Record<string, string>,
    });

    await this.client.connect(this.transport);
    this.connected = true;
  }

  async listTools(): Promise<MCPTool[]> {
    if (!this.connected) {
      throw new Error('MCP client not connected');
    }

    const response = await this.client.listTools();
    return response.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema as MCPTool['inputSchema'],
    }));
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<string> {
    if (!this.connected) {
      throw new Error('MCP client not connected');
    }

    const response = await this.client.callTool({ name, arguments: args });

    // Extract text content from response
    const contents = response.content as Array<{ type: string; text?: string }>;
    const textParts = contents
      .filter((c) => c.type === 'text' && c.text)
      .map((c) => c.text);

    return textParts.join('\n') || JSON.stringify(response.content);
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getServerName(): string {
    return this.serverName;
  }

  // Convert MCP tools to our Tool interface
  async getTools(): Promise<Tool[]> {
    const mcpTools = await this.listTools();

    return mcpTools.map((mcpTool) => ({
      definition: {
        name: `${this.serverName}__${mcpTool.name}`,
        description: mcpTool.description || `MCP tool: ${mcpTool.name}`,
        parameters: {
          type: 'object' as const,
          properties: (mcpTool.inputSchema.properties || {}) as Record<string, { type: string; description: string }>,
          required: mcpTool.inputSchema.required,
        },
      },
      execute: async (args: Record<string, unknown>) => {
        return this.callTool(mcpTool.name, args);
      },
    }));
  }
}

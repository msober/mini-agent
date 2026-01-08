import { MCPClient } from './client.js';
import type { MCPServerConfig } from './types.js';
import type { Tool } from '../tools/types.js';

export class MCPServerManager {
  private servers: Map<string, MCPClient> = new Map();

  async addServer(config: MCPServerConfig): Promise<void> {
    if (this.servers.has(config.name)) {
      throw new Error(`Server already exists: ${config.name}`);
    }

    const client = new MCPClient(config);
    await client.connect(config);
    this.servers.set(config.name, client);
  }

  async removeServer(name: string): Promise<void> {
    const client = this.servers.get(name);
    if (client) {
      await client.disconnect();
      this.servers.delete(name);
    }
  }

  getServer(name: string): MCPClient | undefined {
    return this.servers.get(name);
  }

  listServers(): string[] {
    return Array.from(this.servers.keys());
  }

  async getAllTools(): Promise<Tool[]> {
    const allTools: Tool[] = [];

    for (const client of this.servers.values()) {
      try {
        const tools = await client.getTools();
        allTools.push(...tools);
      } catch (error) {
        console.error(`Error getting tools from ${client.getServerName()}:`, error);
      }
    }

    return allTools;
  }

  async disconnectAll(): Promise<void> {
    for (const client of this.servers.values()) {
      await client.disconnect();
    }
    this.servers.clear();
  }
}

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import type { MCPServerConfig } from '../mcp/types.js';

export const config = {
  apiKey: process.env.OPENAI_API_KEY || '',
  baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  model: process.env.MODEL || 'gpt-4o',
  mcpConfigPath: process.env.MCP_CONFIG_PATH || './mcp-servers.json',
};

export function loadMCPConfig(): MCPServerConfig[] {
  const configPath = path.resolve(process.cwd(), config.mcpConfigPath);

  if (!fs.existsSync(configPath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const json = JSON.parse(content);

    // Support both array format and { mcpServers: {...} } format
    if (Array.isArray(json)) {
      return json;
    }

    if (json.mcpServers && typeof json.mcpServers === 'object') {
      return Object.entries(json.mcpServers).map(([name, serverConfig]) => ({
        name,
        ...(serverConfig as Omit<MCPServerConfig, 'name'>),
      }));
    }

    return [];
  } catch (error) {
    console.error('Error loading MCP config:', error);
    return [];
  }
}

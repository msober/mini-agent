import * as readline from 'readline';
import chalk from 'chalk';
import { Agent } from './core/agent.js';
import {
  bashTool,
  readTool,
  writeTool,
  editTool,
  globTool,
  grepTool,
} from './tools/builtin/index.js';

const SYSTEM_PROMPT = `You are a helpful coding assistant with access to tools.
You can execute bash commands, read/write files, and search code.
Always use tools when appropriate to help the user.`;

function createReadline(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function question(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

export async function runCLI(): Promise<void> {
  const agent = new Agent(SYSTEM_PROMPT);

  // Register all builtin tools
  agent.registerTool(bashTool);
  agent.registerTool(readTool);
  agent.registerTool(writeTool);
  agent.registerTool(editTool);
  agent.registerTool(globTool);
  agent.registerTool(grepTool);

  // Load MCP servers from config
  await agent.loadMCPServers();

  const rl = createReadline();

  console.log(chalk.cyan('Mini-Agent v0.3.0'));
  console.log(chalk.gray('Tools: bash, read, write, edit, glob, grep'));
  const mcpServers = agent.listMCPServers();
  if (mcpServers.length > 0) {
    console.log(chalk.gray(`MCP Servers: ${mcpServers.join(', ')}`));
  }
  console.log(chalk.gray('Type "exit" to quit.\n'));

  while (true) {
    const input = await question(rl, chalk.green('> '));
    const trimmed = input.trim();

    if (!trimmed) {
      continue;
    }

    if (trimmed.toLowerCase() === 'exit') {
      console.log(chalk.gray('Goodbye!'));
      await agent.shutdown();
      break;
    }

    try {
      const response = await agent.run(trimmed);
      console.log(chalk.blue('\nAssistant:'), response);
      console.log();
    } catch (error) {
      console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
      console.log();
    }
  }

  rl.close();
}

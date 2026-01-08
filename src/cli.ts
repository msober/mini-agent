import * as readline from 'readline';
import chalk from 'chalk';
import { Agent } from './core/agent.js';
import { TodoManager } from './todo/index.js';
import { builtinSubagents } from './subagent/index.js';
import {
  bashTool,
  readTool,
  writeTool,
  editTool,
  globTool,
  grepTool,
  createTodoWriteTool,
} from './tools/builtin/index.js';

const SYSTEM_PROMPT = `You are a helpful coding assistant with access to tools.
You can execute bash commands, read/write files, and search code.

IMPORTANT: Use the todo_write tool to track your tasks when working on multi-step tasks.
- Create a todo list at the start of complex tasks
- Update task status as you work (pending -> in_progress -> completed)
- This helps the user see your progress

You can delegate specialized tasks to subagents using the delegate_task tool:
- explorer: For searching and exploring the codebase
- researcher: For reading and understanding code
- planner: For creating implementation plans`;

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
  const todoManager = new TodoManager();
  const agent = new Agent(SYSTEM_PROMPT);

  // Register all builtin tools
  agent.registerTool(bashTool);
  agent.registerTool(readTool);
  agent.registerTool(writeTool);
  agent.registerTool(editTool);
  agent.registerTool(globTool);
  agent.registerTool(grepTool);
  agent.registerTool(createTodoWriteTool(todoManager));

  // Register builtin subagents
  for (const subagent of builtinSubagents) {
    agent.registerSubagent(subagent);
  }
  agent.initializeSubagents();

  // Load MCP servers from config
  await agent.loadMCPServers();

  const rl = createReadline();

  console.log(chalk.cyan('Mini-Agent v0.5.0'));
  console.log(chalk.gray('Tools: bash, read, write, edit, glob, grep, todo_write, delegate_task'));
  console.log(chalk.gray(`Subagents: ${agent.listSubagents().join(', ')}`));
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

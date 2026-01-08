import chalk from 'chalk';
import { WorkerAgent } from './worker.js';
import type { Tool } from '../tools/types.js';
import type { SubagentConfig, SubagentResult } from './types.js';

export class SubagentManager {
  private subagents: Map<string, SubagentConfig> = new Map();
  private availableTools: Map<string, Tool> = new Map();

  registerSubagent(config: SubagentConfig): void {
    this.subagents.set(config.name, config);
  }

  unregisterSubagent(name: string): void {
    this.subagents.delete(name);
  }

  setAvailableTools(tools: Map<string, Tool>): void {
    this.availableTools = tools;
  }

  getSubagentNames(): string[] {
    return Array.from(this.subagents.keys());
  }

  getSubagentDescriptions(): string {
    const descriptions: string[] = [];
    for (const [name, config] of this.subagents) {
      descriptions.push(`- ${name}: ${config.description}`);
    }
    return descriptions.join('\n');
  }

  async delegateTask(agentName: string, task: string): Promise<SubagentResult> {
    const config = this.subagents.get(agentName);
    if (!config) {
      return {
        success: false,
        output: '',
        error: `Subagent "${agentName}" not found. Available: ${this.getSubagentNames().join(', ')}`,
      };
    }

    console.log(chalk.magenta(`\n[Subagent: ${agentName}] Starting task...`));
    console.log(chalk.gray(`Task: ${task.substring(0, 100)}${task.length > 100 ? '...' : ''}`));

    const worker = new WorkerAgent(config, this.availableTools);
    const result = await worker.execute(task);

    if (result.success) {
      console.log(chalk.magenta(`[Subagent: ${agentName}] Completed`));
    } else {
      console.log(chalk.red(`[Subagent: ${agentName}] Failed: ${result.error}`));
    }

    return result;
  }
}

export function createSubagentTool(manager: SubagentManager): Tool {
  return {
    definition: {
      name: 'delegate_task',
      description: `Delegate a task to a specialized subagent. Available subagents:\n${manager.getSubagentDescriptions() || 'None registered'}`,
      parameters: {
        type: 'object',
        properties: {
          agent_name: {
            type: 'string',
            description: 'The name of the subagent to delegate to',
          },
          task: {
            type: 'string',
            description: 'The task to delegate. Be specific and provide context.',
          },
        },
        required: ['agent_name', 'task'],
      },
    },
    async execute(args: Record<string, unknown>): Promise<string> {
      const agentName = args.agent_name as string;
      const task = args.task as string;

      const result = await manager.delegateTask(agentName, task);

      if (result.success) {
        return result.output;
      } else {
        return `Subagent error: ${result.error}`;
      }
    },
  };
}

// Builtin subagent configs
export const builtinSubagents: SubagentConfig[] = [
  {
    name: 'explorer',
    description: 'Explores codebase structure, finds files, and searches code',
    systemPrompt: `You are a code exploration assistant. Your job is to:
- Search for files and code patterns
- Understand codebase structure
- Find relevant files for a given task
Be concise in your responses. Report findings clearly.`,
    tools: ['glob', 'grep', 'read'],
  },
  {
    name: 'researcher',
    description: 'Researches and gathers information by reading files',
    systemPrompt: `You are a research assistant. Your job is to:
- Read and understand code files
- Summarize findings
- Answer questions about code behavior
Be thorough but concise. Provide relevant code snippets when helpful.`,
    tools: ['read', 'glob', 'grep'],
  },
  {
    name: 'planner',
    description: 'Plans implementation steps for complex tasks',
    systemPrompt: `You are a planning assistant. Your job is to:
- Analyze the task requirements
- Explore the codebase to understand context
- Create a step-by-step implementation plan
Output a clear, numbered list of steps. Each step should be actionable.`,
    tools: ['glob', 'grep', 'read'],
  },
];

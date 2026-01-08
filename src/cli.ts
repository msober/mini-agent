import * as readline from 'readline';
import chalk from 'chalk';
import { LLMClient } from './llm/client.js';
import { Conversation } from './core/conversation.js';

const SYSTEM_PROMPT = `You are a helpful assistant.`;

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
  const client = new LLMClient();
  const conversation = new Conversation(SYSTEM_PROMPT);
  const rl = createReadline();

  console.log(chalk.cyan('Mini-Agent v0.1.0'));
  console.log(chalk.gray('Type "exit" to quit.\n'));

  while (true) {
    const input = await question(rl, chalk.green('> '));
    const trimmed = input.trim();

    if (!trimmed) {
      continue;
    }

    if (trimmed.toLowerCase() === 'exit') {
      console.log(chalk.gray('Goodbye!'));
      break;
    }

    conversation.addUser(trimmed);

    try {
      process.stdout.write(chalk.blue('Assistant: '));

      let response = '';
      for await (const chunk of client.streamChat(conversation.getMessages())) {
        process.stdout.write(chunk);
        response += chunk;
      }

      console.log('\n');
      conversation.addAssistant(response);
    } catch (error) {
      console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
      console.log();
    }
  }

  rl.close();
}

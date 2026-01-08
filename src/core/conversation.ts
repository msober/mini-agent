import type { Message } from '../llm/types.js';

export class Conversation {
  private messages: Message[] = [];
  private systemPrompt: string;

  constructor(systemPrompt: string = '') {
    this.systemPrompt = systemPrompt;
  }

  addUser(content: string): void {
    this.messages.push({ role: 'user', content });
  }

  addAssistant(content: string): void {
    this.messages.push({ role: 'assistant', content });
  }

  getMessages(): Message[] {
    const msgs: Message[] = [];
    if (this.systemPrompt) {
      msgs.push({ role: 'system', content: this.systemPrompt });
    }
    return msgs.concat(this.messages);
  }

  clear(): void {
    this.messages = [];
  }
}

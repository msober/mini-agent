import type { Message, ToolCall } from '../llm/types.js';

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

  addAssistantWithToolCalls(toolCalls: ToolCall[]): void {
    this.messages.push({
      role: 'assistant',
      content: null,
      tool_calls: toolCalls,
    });
  }

  addToolResult(toolCallId: string, result: string): void {
    this.messages.push({
      role: 'tool',
      content: result,
      tool_call_id: toolCallId,
    });
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

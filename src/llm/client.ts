import OpenAI from 'openai';
import { config } from '../config/env.js';
import type { Message, LLMResponse, ToolCall } from './types.js';
import type { ToolDefinition } from '../tools/types.js';

export class LLMClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }

  async chat(messages: Message[]): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: config.model,
      messages: messages as OpenAI.ChatCompletionMessageParam[],
    });

    return response.choices[0]?.message?.content || '';
  }

  async chatWithTools(
    messages: Message[],
    tools: ToolDefinition[]
  ): Promise<LLMResponse> {
    const openaiTools: OpenAI.ChatCompletionTool[] = tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    const response = await this.client.chat.completions.create({
      model: config.model,
      messages: messages as OpenAI.ChatCompletionMessageParam[],
      tools: openaiTools.length > 0 ? openaiTools : undefined,
    });

    const choice = response.choices[0];
    const message = choice?.message;

    const toolCalls: ToolCall[] | undefined = message?.tool_calls?.map((tc) => {
      const toolCall = tc as { id: string; type: string; function: { name: string; arguments: string } };
      return {
        id: toolCall.id,
        type: 'function' as const,
        function: {
          name: toolCall.function.name,
          arguments: toolCall.function.arguments,
        },
      };
    });

    return {
      content: message?.content || null,
      toolCalls,
    };
  }

  async *streamChat(messages: Message[]): AsyncGenerator<string> {
    const stream = await this.client.chat.completions.create({
      model: config.model,
      messages: messages as OpenAI.ChatCompletionMessageParam[],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}

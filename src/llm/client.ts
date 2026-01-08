import OpenAI from 'openai';
import { config } from '../config/env.js';
import type { Message, LLMResponse } from './types.js';

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

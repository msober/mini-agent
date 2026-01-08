import * as fs from 'fs/promises';
import * as path from 'path';
import type { Tool } from '../types.js';

export const writeTool: Tool = {
  definition: {
    name: 'write',
    description: 'Write content to a file (creates directories if needed)',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'The path to the file to write',
        },
        content: {
          type: 'string',
          description: 'The content to write to the file',
        },
      },
      required: ['file_path', 'content'],
    },
  },

  async execute(args: Record<string, unknown>): Promise<string> {
    const filePath = args.file_path as string;
    const content = args.content as string;

    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(filePath, content, 'utf-8');
      return `Successfully wrote to ${filePath}`;
    } catch (error) {
      return `Error: ${(error as Error).message}`;
    }
  },
};

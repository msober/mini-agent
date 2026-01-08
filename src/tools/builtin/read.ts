import * as fs from 'fs/promises';
import type { Tool } from '../types.js';

export const readTool: Tool = {
  definition: {
    name: 'read',
    description: 'Read the contents of a file',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'The path to the file to read',
        },
      },
      required: ['file_path'],
    },
  },

  async execute(args: Record<string, unknown>): Promise<string> {
    const filePath = args.file_path as string;

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return `Error: File not found: ${filePath}`;
      }
      return `Error: ${(error as Error).message}`;
    }
  },
};

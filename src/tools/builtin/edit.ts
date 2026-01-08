import * as fs from 'fs/promises';
import type { Tool } from '../types.js';

export const editTool: Tool = {
  definition: {
    name: 'edit',
    description: 'Edit a file by replacing a specific string with another string',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'The path to the file to edit',
        },
        old_string: {
          type: 'string',
          description: 'The exact string to find and replace',
        },
        new_string: {
          type: 'string',
          description: 'The string to replace it with',
        },
      },
      required: ['file_path', 'old_string', 'new_string'],
    },
  },

  async execute(args: Record<string, unknown>): Promise<string> {
    const filePath = args.file_path as string;
    const oldString = args.old_string as string;
    const newString = args.new_string as string;

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      if (!content.includes(oldString)) {
        return `Error: Could not find the specified string in ${filePath}`;
      }

      // Count occurrences
      const occurrences = content.split(oldString).length - 1;
      if (occurrences > 1) {
        return `Error: Found ${occurrences} occurrences of the string. Please provide a more specific string to ensure a unique match.`;
      }

      const newContent = content.replace(oldString, newString);
      await fs.writeFile(filePath, newContent, 'utf-8');

      return `Successfully edited ${filePath}`;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return `Error: File not found: ${filePath}`;
      }
      return `Error: ${(error as Error).message}`;
    }
  },
};

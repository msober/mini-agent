import * as fs from 'fs/promises';
import * as path from 'path';
import type { Tool } from '../types.js';

async function globMatch(
  dir: string,
  pattern: string,
  results: string[] = []
): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip node_modules and hidden directories
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue;
    }

    if (entry.isDirectory()) {
      await globMatch(fullPath, pattern, results);
    } else if (entry.isFile()) {
      if (matchPattern(entry.name, pattern) || matchPattern(fullPath, pattern)) {
        results.push(fullPath);
      }
    }
  }

  return results;
}

function matchPattern(str: string, pattern: string): boolean {
  // Simple glob matching: * matches anything, ** matches any path
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{DOUBLESTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\{\{DOUBLESTAR\}\}/g, '.*');

  const regex = new RegExp(`${regexPattern}$`);
  return regex.test(str);
}

export const globTool: Tool = {
  definition: {
    name: 'glob',
    description: 'Find files matching a glob pattern (e.g., "**/*.ts", "*.json")',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'The glob pattern to match files against',
        },
        path: {
          type: 'string',
          description: 'The directory to search in (defaults to current directory)',
        },
      },
      required: ['pattern'],
    },
  },

  async execute(args: Record<string, unknown>): Promise<string> {
    const pattern = args.pattern as string;
    const searchPath = (args.path as string) || process.cwd();

    try {
      const results = await globMatch(searchPath, pattern);

      if (results.length === 0) {
        return `No files found matching pattern: ${pattern}`;
      }

      return results.join('\n');
    } catch (error) {
      return `Error: ${(error as Error).message}`;
    }
  },
};

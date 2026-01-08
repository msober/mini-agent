import * as fs from 'fs/promises';
import * as path from 'path';
import type { Tool } from '../types.js';

interface GrepMatch {
  file: string;
  line: number;
  content: string;
}

async function searchInFile(
  filePath: string,
  pattern: RegExp
): Promise<GrepMatch[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  const matches: GrepMatch[] = [];

  lines.forEach((line, index) => {
    if (pattern.test(line)) {
      matches.push({
        file: filePath,
        line: index + 1,
        content: line.trim(),
      });
    }
  });

  return matches;
}

async function searchDir(
  dir: string,
  pattern: RegExp,
  include: string | undefined,
  results: GrepMatch[] = []
): Promise<GrepMatch[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip node_modules and hidden directories
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
      continue;
    }

    if (entry.isDirectory()) {
      await searchDir(fullPath, pattern, include, results);
    } else if (entry.isFile()) {
      // Check include pattern
      if (include && !entry.name.endsWith(include.replace('*', ''))) {
        continue;
      }

      try {
        const matches = await searchInFile(fullPath, pattern);
        results.push(...matches);
      } catch {
        // Skip files that can't be read
      }
    }
  }

  return results;
}

export const grepTool: Tool = {
  definition: {
    name: 'grep',
    description: 'Search for a pattern in files',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'The regex pattern to search for',
        },
        path: {
          type: 'string',
          description: 'The directory to search in (defaults to current directory)',
        },
        include: {
          type: 'string',
          description: 'File pattern to include (e.g., "*.ts")',
        },
      },
      required: ['pattern'],
    },
  },

  async execute(args: Record<string, unknown>): Promise<string> {
    const patternStr = args.pattern as string;
    const searchPath = (args.path as string) || process.cwd();
    const include = args.include as string | undefined;

    try {
      const pattern = new RegExp(patternStr, 'i');
      const results = await searchDir(searchPath, pattern, include);

      if (results.length === 0) {
        return `No matches found for pattern: ${patternStr}`;
      }

      // Limit results to avoid overwhelming output
      const limited = results.slice(0, 50);
      const output = limited
        .map((m) => `${m.file}:${m.line}: ${m.content}`)
        .join('\n');

      if (results.length > 50) {
        return `${output}\n\n... and ${results.length - 50} more matches`;
      }

      return output;
    } catch (error) {
      return `Error: ${(error as Error).message}`;
    }
  },
};

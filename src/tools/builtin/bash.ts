import { spawn } from 'child_process';
import type { Tool } from '../types.js';

export const bashTool: Tool = {
  definition: {
    name: 'bash',
    description: 'Execute a bash command and return the output',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The bash command to execute',
        },
      },
      required: ['command'],
    },
  },

  async execute(args: Record<string, unknown>): Promise<string> {
    const command = args.command as string;

    return new Promise((resolve) => {
      const proc = spawn('bash', ['-c', command], {
        cwd: process.cwd(),
        env: process.env,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stdout || 'Command executed successfully (no output)');
        } else {
          resolve(`Exit code ${code}\n${stderr || stdout}`);
        }
      });

      proc.on('error', (err) => {
        resolve(`Error: ${err.message}`);
      });
    });
  },
};

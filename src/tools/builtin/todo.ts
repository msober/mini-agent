import type { Tool } from '../types.js';
import type { TodoManager, Todo } from '../../todo/index.js';

export function createTodoWriteTool(todoManager: TodoManager): Tool {
  return {
    definition: {
      name: 'todo_write',
      description: 'Update the todo list. Use this to track tasks and show progress to the user.',
      parameters: {
        type: 'object',
        properties: {
          todos: {
            type: 'array',
            description: 'The complete todo list',
            items: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'The task description',
                },
                status: {
                  type: 'string',
                  enum: ['pending', 'in_progress', 'completed'],
                  description: 'The task status',
                },
              },
              required: ['content', 'status'],
            },
          },
        },
        required: ['todos'],
      },
    },

    async execute(args: Record<string, unknown>): Promise<string> {
      const todos = args.todos as Array<{ content: string; status: string }>;

      if (!Array.isArray(todos)) {
        return 'Error: todos must be an array';
      }

      const validTodos: Todo[] = todos.map((t) => ({
        content: String(t.content || ''),
        status: (['pending', 'in_progress', 'completed'].includes(t.status)
          ? t.status
          : 'pending') as Todo['status'],
      }));

      todoManager.setTodos(validTodos);

      return `Todo list updated with ${validTodos.length} items`;
    },
  };
}

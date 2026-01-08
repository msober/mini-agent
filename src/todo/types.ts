export type TodoStatus = 'pending' | 'in_progress' | 'completed';

export interface Todo {
  content: string;
  status: TodoStatus;
}

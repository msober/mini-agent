export interface SubagentConfig {
  name: string;
  description: string;
  systemPrompt: string;
  tools?: string[]; // Tool names this subagent can use
}

export interface SubagentResult {
  success: boolean;
  output: string;
  error?: string;
}

export interface SubagentTask {
  agentName: string;
  task: string;
}

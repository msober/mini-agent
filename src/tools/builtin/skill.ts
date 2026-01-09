import type { Tool } from '../types.js';
import type { SkillRegistry } from '../../skills/registry.js';

/**
 * Create the load_skill tool
 *
 * This tool allows the LLM to load domain knowledge on-demand.
 * The skill content is injected via tool_result, preserving prompt cache.
 */
export function createLoadSkillTool(registry: SkillRegistry): Tool {
  return {
    definition: {
      name: 'load_skill',
      description: `Load domain expertise for a specific task. ${registry.getMetadataPrompt()}`,
      parameters: {
        type: 'object',
        properties: {
          skill_name: {
            type: 'string',
            description: `The skill to load. Available: ${registry.list().join(', ') || 'none'}`,
          },
        },
        required: ['skill_name'],
      },
    },
    async execute(args: Record<string, unknown>): Promise<string> {
      const skillName = args.skill_name as string;

      const skill = registry.getSkillContent(skillName);
      if (!skill) {
        return `Skill "${skillName}" not found. Available skills: ${registry.list().join(', ') || 'none'}`;
      }

      // Return the full skill content for injection
      return `# Skill Loaded: ${skill.metadata.name}

${skill.body}

---
You now have this expertise loaded. Apply it to the current task.`;
    },
  };
}

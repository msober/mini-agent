import type { SkillMetadata, SkillContent } from './types.js';
import { scanSkillsDirectory } from './loader.js';

export class SkillRegistry {
  private skills: Map<string, SkillContent> = new Map();

  /**
   * Load all skills from directory
   */
  loadFromDirectory(skillsDir: string): void {
    const skills = scanSkillsDirectory(skillsDir);
    for (const skill of skills) {
      this.skills.set(skill.metadata.name, skill);
    }
  }

  /**
   * Register a skill manually
   */
  register(skill: SkillContent): void {
    this.skills.set(skill.metadata.name, skill);
  }

  /**
   * Get skill metadata list (for system prompt)
   * ~100 tokens per skill
   */
  getMetadataList(): SkillMetadata[] {
    return Array.from(this.skills.values()).map((s) => s.metadata);
  }

  /**
   * Get formatted metadata for system prompt
   */
  getMetadataPrompt(): string {
    const metadata = this.getMetadataList();
    if (metadata.length === 0) {
      return '';
    }

    const lines = metadata.map((m) => `- ${m.name}: ${m.description}`);
    return `Available skills (use load_skill tool to activate):\n${lines.join('\n')}`;
  }

  /**
   * Load full skill content (for tool_result injection)
   * ~2000 tokens
   */
  getSkillContent(name: string): SkillContent | undefined {
    return this.skills.get(name);
  }

  /**
   * Check if skill exists
   */
  has(name: string): boolean {
    return this.skills.has(name);
  }

  /**
   * List all skill names
   */
  list(): string[] {
    return Array.from(this.skills.keys());
  }
}

/**
 * Skills = Domain knowledge loaded on-demand
 *
 * Tools: What model CAN do (capabilities)
 * Skills: How model KNOWS to do (expertise/knowledge)
 *
 * Progressive disclosure:
 * - Layer 1: Metadata (always in system prompt) ~100 tokens
 * - Layer 2: SKILL.md body (injected via tool_result) ~2000 tokens
 */

// Metadata extracted from YAML frontmatter
export interface SkillMetadata {
  name: string;
  description: string;
}

// Full skill content
export interface SkillContent {
  metadata: SkillMetadata;
  body: string; // Markdown instructions
}

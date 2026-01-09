import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYaml } from 'yaml';
import type { SkillMetadata, SkillContent } from './types.js';

/**
 * Parse SKILL.md file with YAML frontmatter
 *
 * Format:
 * ---
 * name: skill-name
 * description: What this skill does
 * ---
 *
 * # Skill Content
 * Markdown body with instructions...
 */
export function parseSkillFile(filePath: string): SkillContent {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseSkillContent(content, filePath);
}

export function parseSkillContent(content: string, filePath: string = ''): SkillContent {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    throw new Error(`Invalid SKILL.md format: missing YAML frontmatter in ${filePath}`);
  }

  const [, yamlContent, body] = match;
  const frontmatter = parseYaml(yamlContent) as { name: string; description: string };

  if (!frontmatter.name || !frontmatter.description) {
    throw new Error(`SKILL.md must have 'name' and 'description' in frontmatter: ${filePath}`);
  }

  return {
    metadata: {
      name: frontmatter.name,
      description: frontmatter.description,
    },
    body: body.trim(),
  };
}

/**
 * Scan directory for SKILL.md files and load metadata
 */
export function scanSkillsDirectory(skillsDir: string): SkillContent[] {
  const skills: SkillContent[] = [];

  if (!fs.existsSync(skillsDir)) {
    return skills;
  }

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillPath = path.join(skillsDir, entry.name, 'SKILL.md');
      if (fs.existsSync(skillPath)) {
        try {
          const skill = parseSkillFile(skillPath);
          skills.push(skill);
        } catch (error) {
          console.error(`Failed to load skill from ${skillPath}:`, error);
        }
      }
    }
  }

  return skills;
}

# Mini-Agent

[English](README.md) | [中文](README_CN.md)

A command-line agent tool inspired by Claude Code, designed for learning Agent development.

> **📖 New to Agent development?** Read the [Agent Development Guide](docs/agent-development-guide.md) for a comprehensive walkthrough of building an AI Agent from scratch in 6 steps.

## Features

- [x] **Step 1: Basic Conversation** - CLI interaction + Streaming output
- [x] **Step 2: Tool Calling** - Function calling (bash, read, write, edit, glob, grep)
- [x] **Step 3: MCP Support** - Model Context Protocol
- [x] **Step 4: TODO Management** - Task list management (`todo_write` tool)
- [x] **Step 5: Sub-agents** - Delegate tasks to specialized sub-agents (`delegate_task` tool)
- [x] **Step 6: Skill System** - On-demand domain knowledge injection (`load_skill` tool)

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and fill in your API Key

# Build
npm run build

# Run
npm start
```

## Environment Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| OPENAI_API_KEY | API Key | - |
| OPENAI_BASE_URL | API Base URL | https://api.openai.com/v1 |
| MODEL | Model Name | gpt-4o |
| MCP_CONFIG_PATH | MCP Config Path | ./mcp-servers.json |

## MCP Configuration

Create an `mcp-servers.json` file to configure MCP servers. They will connect automatically upon startup:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/context7-mcp"]
    }
  }
}
```

Refer to the `mcp-servers.example.json` file for examples.

## Project Structure

```
src/
├── index.ts              # Entry point
├── cli.ts                # CLI main loop
├── config/
│   └── env.ts            # Environment variable config
├── core/
│   ├── agent.ts          # Agent core class
│   └── conversation.ts   # Conversation history management
├── llm/
│   ├── client.ts         # OpenAI client
│   └── types.ts          # Type definitions
├── tools/
│   ├── types.ts          # Tool type definitions
│   ├── registry.ts       # Tool registry
│   └── builtin/          # Built-in tools
│       ├── bash.ts       # Command execution
│       ├── read.ts       # File reading
│       ├── write.ts      # File writing
│       ├── edit.ts       # Precision editing
│       ├── glob.ts       # File searching
│       ├── grep.ts       # Content searching
│       ├── todo.ts       # TODO management
│       └── skill.ts      # Skill loading
├── mcp/
│   ├── types.ts          # MCP type definitions
│   ├── client.ts         # MCP client
│   └── server.ts         # MCP server management
├── todo/
│   ├── types.ts          # TODO type definitions
│   └── manager.ts        # TODO list management
├── subagent/
│   ├── types.ts          # Sub-agent type definitions
│   ├── worker.ts         # WorkerAgent executor
│   └── manager.ts        # Sub-agent management + delegate_task tool
└── skills/
    ├── types.ts          # Skill type definitions
    ├── loader.ts         # SKILL.md parser
    └── registry.ts       # Skill registry

skills/                   # Skills directory (Project root)
└── code-review/
    └── SKILL.md          # Code review skill
```

## Core Concepts

### Tools vs Skills

| Concept | Essence | Examples |
|---------|---------|----------|
| **Tool** | What the model **can do** (capabilities) | bash, read, write, glob, grep |
| **Skill** | What the model **knows how to do** (expertise) | code-review, MCP development, PDF processing |

### Skill System

Skills represent on-demand domain knowledge injected into the conversation via the `load_skill` tool:

1.  **Progressive Loading**: Metadata (~100 tokens) → SKILL.md content (~2000 tokens).
2.  **Cache Friendly**: Injected via `tool_result`, does not modify the system prompt.
3.  **Hot-Swappable**: Teach the model a new skill simply by writing a `SKILL.md` file.

### SKILL.md Format

```markdown
---
name: code-review
description: Perform thorough code reviews...
---

# Code Review Skill

You now have expertise in conducting comprehensive code reviews...

## Checklist
- [ ] Security issues
- [ ] Performance problems
...
```

### Sub-agents

Built-in sub-agents are invoked via the `delegate_task` tool:

| Sub-agent | Purpose | Available Tools |
|-----------|---------|-----------------|
| explorer | Search codebase structure | glob, grep, read |
| researcher | Read and understand code | read, glob, grep |
| planner | Create implementation plans | glob, grep, read |

## Implementation Details

### Step 1: Basic Conversation
- readline CLI interaction
- OpenAI protocol streaming output
- Conversation history management

### Step 2: Tool Calling
- Tool interface definition
- Tool registry
- Built-in tools: bash, read, write, edit, glob, grep
- Agent tool calling loop

### Step 3: MCP Support
- MCP Client encapsulation
- Server connection management
- Automatic configuration file loading

### Step 4: TODO Management
- `TodoManager` for task list management
- `todo_write` tool
- State tracking: pending → in_progress → completed

### Step 5: Sub-agents
- `SubagentConfig` configuration
- `WorkerAgent` independent executor
- `delegate_task` tool

### Step 6: Skill System
- `SKILL.md` parsing (YAML frontmatter + Markdown body)
- `SkillRegistry` metadata management
- `load_skill` tool (knowledge injection)
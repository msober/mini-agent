# Mini-Agent

[English](README.md) | [中文](README_CN.md)

一个类似 Claude Code 的命令行 agent 工具，用于学习 Agent 开发。

> **📖 Agent 开发新手？** 阅读 [Agent 开发指南](docs/agent-development-guide_cn.md)，了解如何通过 6 个步骤从零构建 AI Agent 的完整教程。

## 功能特性

- [x] 步骤1: 基础对话 - 命令行交互 + 流式输出 ([be88f03](https://github.com/msober/mini-agent/commit/be88f03))
- [x] 步骤2: 工具调用 - function calling (bash, read, write, edit, glob, grep) ([dae56bc](https://github.com/msober/mini-agent/commit/dae56bc))
- [x] 步骤3: MCP 支持 - Model Context Protocol ([d238b9d](https://github.com/msober/mini-agent/commit/d238b9d))
- [x] 步骤4: TODO 管理 - 任务列表管理 (todo_write 工具) ([6e25680](https://github.com/msober/mini-agent/commit/6e25680))
- [x] 步骤5: 子代理 - 委托任务给专门的 subagent (delegate_task 工具) ([0f25524](https://github.com/msober/mini-agent/commit/0f25524))
- [x] 步骤6: 技能系统 - 按需加载的领域知识注入 (load_skill 工具) ([aa15e81](https://github.com/msober/mini-agent/commit/aa15e81))

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的 API Key

# 编译
npm run build

# 运行
npm start
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| OPENAI_API_KEY | API 密钥 | - |
| OPENAI_BASE_URL | API 地址 | https://api.openai.com/v1 |
| MODEL | 模型名称 | gpt-4o |
| MCP_CONFIG_PATH | MCP 配置文件路径 | ./mcp-servers.json |

## MCP 配置

创建 `mcp-servers.json` 文件配置 MCP 服务器，启动时自动连接：

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

参考 `mcp-servers.example.json` 示例文件。

## 项目结构

```
src/
├── index.ts              # 程序入口
├── cli.ts                # CLI 主循环
├── config/
│   └── env.ts            # 环境变量配置
├── core/
│   ├── agent.ts          # Agent 核心类
│   └── conversation.ts   # 对话历史管理
├── llm/
│   ├── client.ts         # OpenAI 客户端
│   └── types.ts          # 类型定义
├── tools/
│   ├── types.ts          # 工具类型定义
│   ├── registry.ts       # 工具注册表
│   └── builtin/          # 内置工具
│       ├── bash.ts       # 命令执行
│       ├── read.ts       # 文件读取
│       ├── write.ts      # 文件写入
│       ├── edit.ts       # 精确编辑
│       ├── glob.ts       # 文件搜索
│       ├── grep.ts       # 内容搜索
│       ├── todo.ts       # TODO 管理
│       └── skill.ts      # 技能加载
├── mcp/
│   ├── types.ts          # MCP 类型定义
│   ├── client.ts         # MCP 客户端
│   └── server.ts         # MCP 服务器管理
├── todo/
│   ├── types.ts          # TODO 类型定义
│   └── manager.ts        # TODO 列表管理
├── subagent/
│   ├── types.ts          # 子代理类型定义
│   ├── worker.ts         # WorkerAgent 执行器
│   └── manager.ts        # 子代理管理 + delegate_task 工具
└── skills/
    ├── types.ts          # 技能类型定义
    ├── loader.ts         # SKILL.md 解析器
    └── registry.ts       # 技能注册表

skills/                   # 技能目录 (项目根目录)
└── code-review/
    └── SKILL.md          # 代码审查技能
```

## 核心概念

### Tools vs Skills

| 概念 | 本质 | 例子 |
|------|------|------|
| **Tool** | 模型**能做**什么 (capabilities) | bash, read, write, glob, grep |
| **Skill** | 模型**知道怎么做** (expertise) | code-review, MCP 开发, PDF 处理 |

### 技能系统

技能是按需加载的领域知识，通过 `load_skill` 工具注入到对话中：

1. **渐进式加载**: 元数据 (~100 tokens) → SKILL.md 内容 (~2000 tokens)
2. **缓存友好**: 通过 tool_result 注入，不修改 system prompt
3. **热插拔**: 写个 SKILL.md 就能教会模型新技能

### SKILL.md 格式

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

### 子代理

内置子代理通过 `delegate_task` 工具调用：

| 子代理 | 用途 | 可用工具 |
|--------|------|----------|
| explorer | 搜索代码库结构 | glob, grep, read |
| researcher | 阅读理解代码 | read, glob, grep |
| planner | 创建实现计划 | glob, grep, read |

## 实现详情

### 步骤 1: 基础对话 ([be88f03](https://github.com/msober/mini-agent/commit/be88f03))
- readline 命令行交互
- OpenAI 协议流式输出
- 对话历史管理

### 步骤 2: 工具调用 ([dae56bc](https://github.com/msober/mini-agent/commit/dae56bc))
- Tool 接口定义
- 工具注册表
- 内置工具: bash, read, write, edit, glob, grep
- Agent 工具调用循环

### 步骤 3: MCP 支持 ([d238b9d](https://github.com/msober/mini-agent/commit/d238b9d))
- MCP 客户端封装
- 服务器连接管理
- 配置文件自动加载

### 步骤 4: TODO 管理 ([6e25680](https://github.com/msober/mini-agent/commit/6e25680))
- TodoManager 任务列表管理
- todo_write 工具
- 状态跟踪: pending → in_progress → completed

### 步骤 5: 子代理 ([0f25524](https://github.com/msober/mini-agent/commit/0f25524))
- SubagentConfig 配置
- WorkerAgent 独立执行器
- delegate_task 工具

### 步骤 6: 技能系统 ([aa15e81](https://github.com/msober/mini-agent/commit/aa15e81))
- SKILL.md 解析 (YAML frontmatter + Markdown body)
- SkillRegistry 元数据管理
- load_skill 工具 (知识注入)

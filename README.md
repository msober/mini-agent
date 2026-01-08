# Mini-Agent

一个类似 Claude Code 的命令行 agent 工具，用于学习 Agent 开发。

## 功能特性

- [x] 步骤1: 基础对话 - 命令行交互 + 流式输出
- [ ] 步骤2: 工具调用 - function calling (bash, read, write, edit, glob, grep)
- [ ] 步骤3: MCP 支持 - Model Context Protocol
- [ ] 步骤4: 规划能力 - 任务分解与执行
- [ ] 步骤5: 子代理 - 委托任务给专门的 subagent
- [ ] 步骤6: 技能系统 - 可扩展的斜杠命令

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

## 项目结构

```
src/
├── index.ts          # 程序入口
├── cli.ts            # CLI 主循环
├── config/
│   └── env.ts        # 环境变量配置
├── core/
│   └── conversation.ts   # 对话历史管理
└── llm/
    ├── client.ts     # OpenAI 客户端
    └── types.ts      # 类型定义
```

## 实现计划

### 步骤 1: 基础对话 (已完成)
- readline 命令行交互
- OpenAI 协议流式输出
- 对话历史管理

### 步骤 2: 工具调用
- Tool 接口定义
- 工具注册表
- 内置工具: bash, read, write, edit, glob, grep
- Agent 工具调用循环

### 步骤 3: MCP 支持
- MCP 客户端
- 服务器连接管理
- MCP 工具集成

### 步骤 4: 规划能力
- Task/Plan 类型
- Planner (LLM 生成计划)
- PlanExecutor (按计划执行)

### 步骤 5: 子代理
- SubagentConfig 配置
- WorkerAgent 工作代理
- SubagentManager (注册为工具)

### 步骤 6: 技能系统
- Skill 接口
- 技能注册表和加载器
- 内置技能: /commit, /review
- 斜杠命令解析

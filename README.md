# Mini-Agent

一个类似 Claude Code 的命令行 agent 工具，用于学习 Agent 开发。

## 功能特性

- [x] 步骤1: 基础对话 - 命令行交互 + 流式输出
- [x] 步骤2: 工具调用 - function calling (bash, read, write, edit, glob, grep)
- [x] 步骤3: MCP 支持 - Model Context Protocol
- [x] 步骤4: TODO 管理 - 任务列表管理 (todo_write 工具)
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
│       └── grep.ts       # 内容搜索
└── mcp/
    ├── types.ts          # MCP 类型定义
    ├── client.ts         # MCP 客户端
    └── server.ts         # MCP 服务器管理
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

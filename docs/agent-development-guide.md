# Build Your Own Agent: A Practical Guide

> Learn how to build a  AI Agent from scratch in 6 steps

---

## Why Build Your Own Agent?

### The Evolution of AI Applications

AI applications have evolved through three overlapping phases:

1. **Chatbots**: Simple Q&A, passive responses (early implementations, mainstream adoption accelerated with ChatGPT in late 2022)
2. **RAG**: External knowledge retrieval, single-turn calls (research since 2020, widely adopted 2023+)
3. **Agents**: Autonomous planning, tool use, iterative execution (ReAct paper in 2022, rapid adoption 2023+)

**What makes Agents special?** They don't just answer questions—they:
- Break down complex tasks into steps
- Call tools autonomously to gather information or take actions
- Iterate and self-correct when encountering errors
- Complete entire workflows end-to-end

### Why Not Use a Framework?

Frameworks like LangChain and AutoGPT are convenient, but building from scratch offers:
- **Deep understanding**: See exactly how Agents work under the hood
- **Full control**: Customize every aspect for your production needs
- **Extensibility**: Add features without fighting framework abstractions

**This guide** walks through building a Claude Code-like Agent in 6 incremental steps, each building on the previous.

---

## Step 1: Conversation Foundation

> **Commit**: `be88f03` - Basic conversation with streaming output

### What & Why

Before an Agent can act, it must remember. This step builds:
- A CLI interface for user interaction
- Connection to an LLM (using OpenAI protocol)
- Streaming output (tokens appear as they generate)
- **Conversation history management** (the foundation for everything)

**Why start here?** Every Agent feature builds on conversation management. Without it, the Agent has no memory.

**Note**: What we build in this step is a chatbot, not yet an Agent. An Agent requires the ability to take actions—which comes in Step 2.

### Core Components

**Conversation Manager**: Stores messages in order (system → user → assistant → user → ...). Provides the full history to the LLM on each turn.

**LLM Client**: Wraps the OpenAI API with streaming support. Uses AsyncGenerator to yield tokens as they arrive.

**CLI Loop**: Reads user input, calls LLM, displays response, repeats. The `while (true)` loop maintains the interactive session.

### What You Get

**Foundation established**: A chatbot with memory. Simple, but it's the **skeleton** that every subsequent feature builds upon.

---

## Step 2: Tool Calling - Giving the Agent "Hands"

> **Commit**: `dae56bc` - Function calling with 6 tools

### What & Why

Pure language models can only "talk"—they can't act. Function Calling (aka Tool Use) lets the LLM:
- Execute shell commands (`bash`)
- Read and write files (`read`, `write`, `edit`)
- Search code (`glob`, `grep`)

**The breakthrough**: Instead of just answering "You should run `ls`", the Agent actually runs `ls` and sees the output.

**This is where your chatbot becomes an Agent.**

### The ReAct Pattern

The core of every Agent is a **ReAct loop** (Reasoning + Acting). This pattern, introduced in the [ReAct paper](https://arxiv.org/abs/2210.03629), alternates between:
- **Reasoning**: LLM thinks about what to do next
- **Acting**: Execute tools to gather information or make changes
- **Observing**: See tool results and reason again

**Pseudocode**:

```
function agent_loop(user_message):
    conversation.add(user_message)
    
    while true:
        # REASONING: LLM decides what to do
        response = llm.generate(conversation, available_tools)
        
        # Check if LLM wants to use tools
        if response.has_tool_calls():
            for tool_call in response.tool_calls:
                # ACTING: Execute the tool
                result = execute_tool(tool_call)
                # OBSERVING: Add result to conversation
                conversation.add(tool_result(result))
            # Continue loop - LLM reasons about new observations
        else:
            # No tool calls = task complete
            return response.text
```

**The key insight**: This is a `while` loop, not a single call. Each observation informs the next reasoning step, allowing Agents to:
- Break complex tasks into steps
- Adapt based on tool results
- Handle errors and try different approaches

### How It Works

**Tool Registry**: A catalog of available tools. Each tool has:
- A **definition** (name, description, parameters) that tells the LLM what it does
- An **execute** function that performs the actual action

**Agent Loop**: Implements the ReAct pseudocode above. The loop continues until the LLM responds with text only (no tool calls), signaling task completion.

### What You Get

**Capability unlocked**: Your Agent can now autonomously execute commands and manipulate files. It transforms from a passive chatbot to an active automation assistant.

---

## Step 3: MCP - Connecting to the Ecosystem

> **Commit**: `d238b9d` - Model Context Protocol support

### What & Why

Built-in tools are limited. **MCP (Model Context Protocol)** is Anthropic's standard for connecting to external tool servers:
- GitHub operations
- Database queries
- Web search
- ...any community-built tool

**The vision**: Your Agent becomes a hub that can connect to unlimited capabilities via a standard protocol.

### How It Works

**MCP Client**: Connects to external servers via standard input/output pipes using the **stdio transport** (process pipes). This is the most common approach for local tool servers and is what we implement in this step.

The client fetches tool definitions from connected MCP servers and translates them into the same `Tool` interface your built-in tools use.

**Unified Tool Registry**: The LLM sees all tools—built-in and MCP—as a single flat list. It doesn't know (or care) where they come from.

**Auto-loading**: On startup, read `mcp-servers.json` and connect to all configured servers automatically.

### What You Get

**Ecosystem access**: Extensibility without code changes. Need GitHub integration? Add one line to `mcp-servers.json`. Your Agent instantly gains new capabilities.

---

## Step 4: TODO Management - Making Progress Visible

> **Commit**: `6e25680` - Task list tracking

### What & Why

Complex tasks take many steps. Users want to see progress, not just a silent Agent.

**TODO management** lets the Agent:
- List its plan at the start ("I'll do X, then Y, then Z")
- Update status in real-time (pending → in_progress → completed)
- Show what it's working on

**Key insight**: This isn't a TODO list for the user—it's the Agent's work plan, made visible.

### How It Works

**TODO Manager**: Tracks a list of tasks with statuses. Detects changes (new task, status change, completion) and renders only the delta.

**TODO Tool**: The LLM calls `todo_write` to update its plan. System prompt instructs it to use this on multi-step tasks.

**Smart Rendering**: Only show changes to avoid terminal spam. Completed tasks get a green checkmark. Current task shows a spinner.

### Usage Example

```
User: "Refactor auth.ts to extract validators"

Agent calls todo_write:
📋 Tasks:
  ⏳ Read auth.ts
  ⏸ Extract validation functions
  ⏸ Create validators.ts
  ⏸ Update imports

[Agent works...]
  ✓ Completed: Read auth.ts
  ⏳ Extract validation functions
...
```

### What You Get

**Trust through transparency**: Users see the Agent's plan and progress in real-time. No more black box—they know exactly what's happening at each step.

---

## Step 5: Subagents - Specialization Through Delegation

> **Commit**: `0f25524` - Specialized subagents

### What & Why

A single Agent doing everything is inefficient. **Subagents** enable specialization:
- **Main Agent**: Plans and coordinates
- **Subagents**: Execute specialized tasks (search, research, planning)

**Analogy**: A CEO doesn't write code—they delegate to engineers.

### How It Works

**Subagent Config**: Each subagent has:
- A specialized system prompt (e.g., "You're a code search expert")
- Limited tool access (e.g., explorer only gets glob/grep/read)
- Independent conversation history

**Worker Agent**: A mini-Agent that runs the subagent's task. It has its own tool loop with a max iteration limit (prevent infinite loops).

**Delegation Tool**: Main Agent calls `delegate_task(agent_name="explorer", task="Find all API endpoints")`. The subagent executes, returns results, and its conversation is discarded.

### Built-in Subagents

| Name | Purpose | Tools |
|------|---------|-------|
| explorer | Search codebase structure | glob, grep, read |
| researcher | Read and understand code | read, glob, grep |
| planner | Create implementation plans | glob, grep, read |

### Why Delegate?

1. **Focus**: Specialized prompts produce better results for specific tasks
2. **Isolation**: Subagent conversations don't pollute main Agent's context window

**Optional optimization**: You can use different (potentially cheaper) models for subagents handling simpler tasks, though this is a design choice, not an inherent requirement.

### What You Get

**Division of labor**: A modular system where each agent specializes. The main Agent acts as orchestrator, delegating specialized tasks to expert subagents.

---

## Step 6: Skills - Injecting Domain Expertise

> **Commit**: `aa15e81` - On-demand knowledge loading

### What & Why

**Tools** = what the Agent *can do* (bash, read, write)
**Skills** = what the Agent *knows how to do* (code review, PDF processing, MCP development)

**The problem**: How do you teach an Agent specialized knowledge without fine-tuning?

**The solution**: Skills—Markdown files with expert instructions that get loaded on-demand.

### The Skill System Design

| Aspect | Implementation |
|--------|----------------|
| **Storage** | `skills/*/SKILL.md` files with YAML frontmatter |
| **Startup** | Load metadata only (~100 tokens/skill) |
| **Activation** | LLM calls `load_skill("code-review")` when needed |
| **Injection** | Full content (~2000 tokens) returned via `tool_result` |

### Why On-Demand Loading?

Putting all skills in the system prompt has problems:
- **Cost**: 10,000+ tokens charged on every request
- **Noise**: Irrelevant skills distract the model

The skill system solves this:
- **Metadata always loaded**: Cheap (~100 tokens per skill)
- **Full content on-demand**: Only pay when actually used
- **System prompt stability**: Adding/modifying skills doesn't change the system prompt prefix

**Note on caching**: Anthropic's prompt caching is prefix-based. Since skills are injected via `tool_result` (which appears in the conversation, not the system prompt), the system prompt prefix remains cacheable. However, the overall cache efficiency depends on your conversation patterns.

### SKILL.md Format

```markdown
---
name: code-review
description: Comprehensive code review with security checks
---

# Code Review Skill

You are now an expert code reviewer. Follow this checklist:

## Security
- [ ] SQL injection vulnerabilities
- [ ] XSS vulnerabilities
...

## Performance
- [ ] N+1 query problems
...

[Detailed instructions, examples, output format...]
```

### Progressive Disclosure

1. **Startup**: Scan `skills/` directory, load all metadata
2. **System Prompt**: List available skills ("Available skills: code-review, pdf-processing...")
3. **On Use**: LLM calls `load_skill` tool
4. **Injection**: Full SKILL.md content injected via tool result
5. **Application**: LLM applies the loaded expertise to current task

### What You Get

**Teachable expertise**: Give your Agent domain knowledge by writing Markdown files. Want code review skills? Write a SKILL.md. Want PDF processing? Another SKILL.md. No model retraining, no code deployment—just knowledge files.

---

## Putting It All Together

### The 6 Steps Recap

| Step | Capability | Key Technique | Commit |
|------|-----------|---------------|--------|
| 1. Conversation | Memory | History management + streaming | `be88f03` |
| 2. Tool Calling | Action + ReAct | Function calling + tool loop | `dae56bc` |
| 3. MCP | Ecosystem | Protocol adapter + unified registry | `d238b9d` |
| 4. TODO | Transparency | Status tracking + delta rendering | `6e25680` |
| 5. Subagents | Specialization | Delegation + isolated contexts | `0f25524` |
| 6. Skills | Expertise | Metadata indexing + on-demand loading | `aa15e81` |

### How the Pieces Fit

Each step adds a capability to the core ReAct loop:

```
[Step 1] Conversation history maintains context
         ↓
[Step 2] Tool registry + ReAct loop = the Agent core
         ↓
[Step 3] MCP expands available tools
         ↓
[Steps 4-6] Enhanced decision-making:
         ├─ Update TODO (progress visibility)
         ├─ Delegate to subagent (specialization)
         └─ Load skill (domain knowledge)
         ↓
All feed into the ReAct loop:
  Reasoning → Acting → Observing → (repeat until done)
```

The beauty: **Each feature is a modular addition**. You can build step-by-step, and each addition enhances the Agent's capabilities without breaking existing functionality.

---

## Production Considerations

This mini-agent is for learning. Production requires:

**Security**:
- **Sandbox tool execution** (containers, VMs, or restricted environments)
- **Allowlist approach**: Only permit explicitly approved commands/operations (avoid blocklist thinking—you can't enumerate all dangerous commands)
- **Principle of least privilege**: Tools should have minimal required permissions
- **Secure credential management** (secrets managers, not environment variables)

**Reliability**:
- Retry failed tool calls with exponential backoff
- Timeout controls for all external operations
- Comprehensive logging and tracing
- **Idempotency**: Ensure tool retries are safe (especially for write operations)

**Performance**:
- Prompt caching strategy (stable prefixes, cache-aware message ordering)
- Truncate long tool outputs (with clear indication of truncation)
- Parallel tool calls where the API and logic allow

**Cost Control**:
- **Token budgets**: Set limits per request and per session
- **Rate limiting**: Prevent runaway loops from exhausting API quotas
- **Usage monitoring**: Track and alert on unusual consumption patterns

**Compliance & Observability**:
- **Audit logging**: Record all tool invocations and their results
- **User attribution**: Track which user triggered which actions
- **Data retention policies**: Handle conversation history appropriately

**UX**:
- Graceful interruption (Ctrl+C handling, cleanup on abort)
- Session persistence (resume conversations)
- Conversation optimization (summarization for long contexts)

---

## Next Steps

After mastering these concepts, explore:

1. **Multi-modal Agents**: Process images, PDFs, videos
2. **Multi-Agent Systems**: Agent-to-agent communication protocols
3. **Long-term Memory**: Vector databases + RAG
4. **Self-improvement**: Learning from user feedback

---

## Key Takeaways

**Don't be bound by frameworks**. LangChain and others are useful, but:
- They hide too many details
- Production needs customization
- Understanding fundamentals lets you build exactly what you need

**The value of building from scratch** isn't about reinventing the wheel—it's about:
1. Understanding how Agents really work
2. Gaining debugging and optimization skills
3. Being able to customize freely for your use case

Now you have the knowledge. Go build!

---

## Code Repository

Full code: [mini-agent](https://github.com/anthropics/courses/tree/master/agent_as_code/mini_agent)

**Commit History**:
- `be88f03`: Step 1 - Basic conversation
- `dae56bc`: Step 2 - Tool invocation + ReAct pattern
- `d238b9d`: Step 3 - MCP support
- `6e25680`: Step 4 - TODO management
- `0f25524`: Step 5 - Subagents
- `aa15e81`: Step 6 - Skill system

Each commit corresponds to one step. Use `git checkout <commit>` to see the evolution.
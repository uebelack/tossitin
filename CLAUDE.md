# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TossItIn is a LangGraph-powered tool that automatically generates git commit messages by analyzing repository changes and then commits and pushes them. It uses Claude (via Anthropic API) to inspect git state and create meaningful commit messages.

## Development Commands

### Run the tool locally

```bash
node index.mjs
# or after npm link
tossitin
```

### Install dependencies

```bash
yarn install
# or
npm install
```

### Link for local development

```bash
npm link
# Now you can run 'tossitin' from anywhere
```

### Environment setup

The tool requires the `ANTHROPIC_API_KEY` environment variable:

```bash
export ANTHROPIC_API_KEY=your_key_here
```

### Publishing to npm

```bash
# 1. Ensure you're logged in to npm
npm login

# 2. Update version in package.json (use semantic versioning)
npm version patch  # or minor, or major

# 3. Publish to npm
npm publish

# 4. Users can then install globally
npm install -g tossitin
```

## Architecture

The entire application is contained in a single file (`index.mjs`) built with LangGraph. Understanding the flow is critical:

### LangGraph Workflow (State Graph)

The workflow is a state machine with the following nodes and flow:

1. **START → addFiles**: Stages all changes (`git add .`)
2. **addFiles → checkNothingToCommit**: Validates there are changes to commit
3. **checkNothingToCommit → [generateCommitMessage | END]**: Conditional - exits if nothing to commit
4. **generateCommitMessage**: AI agent analyzes changes using tool calls
5. **generateCommitMessage → [toolNode | structureCommitMessage]**: Conditional - loops through tool calls or proceeds to structuring
6. **toolNode → generateCommitMessage**: Loop back for additional tool execution
7. **structureCommitMessage**: Formats the message into subject + description with emoji
8. **structureCommitMessage → commit**: Creates the git commit
9. **commit → push**: Pushes to remote
10. **push → END**: Workflow complete

### State Schema

The graph maintains state with these fields:

- `messages`: Array of conversation messages (SystemMessage, HumanMessage, ToolMessage, AIMessage)
- `subject`: (optional) Commit message subject line
- `description`: (optional) Commit message body

### Key Components

**Tool Definition**: The `execute` tool allows the AI to run shell commands (primarily git commands like `git status` and `git diff --cached`) to inspect repository state.

**Model Configuration**: Uses `claude-sonnet-4-5` with tool calling capabilities. Two model invocations:

1. `modelWithTools`: For analyzing changes and generating commit message content
2. `modelWithStructure`: For structuring output into subject/description format with structured output

**Conditional Routing**:

- `continueAfterCheck()`: Routes to END if nothing to commit, otherwise continues
- `shouldContinue()`: Routes to toolNode if AI needs to execute tools, otherwise to structureCommitMessage

### Command Execution

Uses `execa` for running git commands:

- `execa('git', [args])`: For array-based arguments (safer, avoids pathspec errors)
- `execaCommand(command)`: For tool execution from AI (shell: true, all: true for combined stdout/stderr)

### UI

Uses `@clack/prompts` for terminal UI (intro, outro, log messages).

## Important Notes

- The workflow automatically stages ALL changes before generating the commit message
- Always pushes after committing (no option to skip push currently)
- Tool uses structured output with JSON Schema for both the execute tool and commit message formatting
- Git commands must be passed as arrays to `execa` to avoid pathspec errors (already implemented correctly)
- State is immutable - nodes return partial state updates that get merged

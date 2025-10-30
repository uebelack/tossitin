# TossItIn

Generate git commit messages using a LangGraph workflow that inspects repo state and commits changes.

## Requirements
- Node.js v22+
- Yarn or npm
- Anthropic API key (ANTHROPIC_API_KEY)
- Git installed and repo initialized

## Install
```bash
yarn install
# or
npm install
```

## Configure
Export your Anthropic key before running:
```bash
export ANTHROPIC_API_KEY=your_key_here
```

## Usage
```bash
node index.mjs
```

What happens:
- Stages files (git add .)
- Uses tools to inspect changes (git status, git diff --cached)
- Structures a commit message (subject + description)
- Commits with both lines (git commit -m subject -m description)

## Files
- index.mjs: LangGraph workflow, tools, and execution
- package.json: dependencies

## Troubleshooting
- 400 invalid tool schema: tool schemas must be JSON Schema (already configured).
- Git pathspec errors: fixed by calling git with argument arrays.
- Nothing to commit: make changes before running.
- Missing API key: ensure ANTHROPIC_API_KEY is set in the shell.

## Notes
- Commands run with execa / execaCommand.
- State includes messages, subject, and description.

# TossItIn

AI-powered git workflow tool that analyzes your changes, generates meaningful commit messages, and pushes to your repository — all in one command.

Built with [LangChain](https://www.langchain.com/) and [Claude](https://www.anthropic.com/claude) (Anthropic) or [Ollama](https://ollama.com/) for local models.

## ⚠️ WARNING

**TossItIn uses large language models (LLMs), which make mistakes.**

LLMs can and will produce incorrect, incomplete, or outright wrong output — including bad commit messages, wrong branch names, and false negatives when scanning for dangerous files. **Do not blindly trust anything this tool generates.** Always review the output before accepting it.

This tool interacts directly with your git repository and can stage files, create commits, and push to remote branches. A mistake here can affect your repository history and your team. **Use it at your own risk.**

---

## Features

- **Branch protection**: Detects protected branches and helps create a properly named feature branch
- **Safe staging**: AI scans new untracked files for dangerous content (secrets, credentials) before adding them
- **Smart commit messages**: Uses an AI agent with git tools to generate subject lines and descriptions
- **Interactive confirmation**: Review and approve the commit message before it's applied (skippable with `--force`)
- **Auto push**: Pushes to remote and sets up tracking branches automatically
- **Jira integration**: Fetches in-progress Jira issues to inform branch names
- **Local LLM support**: Works with Ollama as an alternative to Claude

## Installation

```bash
# Global (recommended)
npm install -g tossitin

# Without installing
npx tossitin

# Local
npm install tossitin
```

## Requirements

- Node.js v22 or higher
- A git repository with at least one remote configured
- An LLM backend (Anthropic API key or Ollama)

## Setup

### Claude (Anthropic)

```bash
export ANTHROPIC_API_KEY=your_api_key_here
```

To make it permanent, add to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
echo 'export ANTHROPIC_API_KEY=your_api_key_here' >> ~/.zshrc
```

Get an API key at [console.anthropic.com](https://console.anthropic.com/).

### Ollama (local)

```bash
export OLLAMA_MODEL=llama3.2
```

TossItIn uses Claude if `ANTHROPIC_API_KEY` is set, otherwise falls back to the model specified in `OLLAMA_MODEL`.

## Usage

```bash
tossitin
```

Or skip all confirmation prompts:

```bash
tossitin --force
```

### What it does

1. **Branch check** — If the current branch is protected (`main`, `master`, `develop`, `release/*`, etc.), it prompts you to describe your work and creates a new branch with an AI-generated name.
2. **Stage files** — Runs `git add .`, but first scans any new untracked files with AI. If a file looks dangerous (e.g., contains secrets or credentials), it stops and warns you before anything is staged.
3. **Generate commit message** — An AI agent runs `git status` and `git diff --cached` to understand your changes, then writes a commit message with a subject line and description.
4. **Confirm and commit** — Shows you the message and asks for confirmation (auto-approved with `--force`).
5. **Push** — Pushes to the remote, automatically setting the upstream tracking branch if needed.

### Example

```
┌  🪄 LET's ToSS IT iN! 💥
│
◇  ✅ Current branch "feat/my-feature" is not protected, let's continue...
◇  🎉 Checking for new files to add...
◇  🧠 Thinking...
◇  🎉 Adding files:
│      👉 src/utils/helper.mjs
◇  🧠 Creating commit message...
◇  👌 Commit message:
│
│  ✨ feat: add helper utility for string formatting
│
│  Introduced a new utility module with string formatting helpers
│  used across multiple components to reduce duplication.
│
◇  Should I commit with this message? › Yes
◇  🎉 Pushing to remote...
│
└  👌 Everything committed and pushed!
```

## Configuration

TossItIn merges configuration from two optional files, in this order:

| File | Scope |
|------|-------|
| `~/.tossitin/config.mjs` | Global (applies to all repos) |
| `.tossitin.config.mjs` | Local (applies to current repo) |

Both files should export a default object:

```js
// .tossitin.config.mjs
export default {
  force: false,
  protectedBranches: ["main", "master", "release/", "develop", "development"],
};
```

### Jira integration

Add Jira config to automatically select an in-progress issue when creating a branch:

```js
// ~/.tossitin/config.mjs
export default {
  jira: {
    url: "https://yourcompany.atlassian.net",
    pat: "your_personal_access_token",
    jql: "assignee = currentUser() AND status = 'In Progress'",
  },
};
```

## Development

```bash
git clone https://github.com/uebelack/tossitin.git
cd tossitin
yarn install

# Run directly
node index.mjs

# Run tests
yarn test

# Lint
yarn lint:check
```

## Troubleshooting

**Nothing to commit** — Make sure you have staged or unstaged changes before running tossitin.

**Missing LLM config** — Set either `ANTHROPIC_API_KEY` or `OLLAMA_MODEL` in your environment.

**Permission denied** — Make sure `index.mjs` is executable:

```bash
chmod +x index.mjs
```

**Push fails** — Ensure your remote is configured (`git remote -v`) and you have push access.

## Architecture

| Package | Purpose |
|---------|---------|
| [@langchain/anthropic](https://www.npmjs.com/package/@langchain/anthropic) | Claude integration |
| [@langchain/ollama](https://www.npmjs.com/package/@langchain/ollama) | Ollama integration |
| [@clack/prompts](https://www.npmjs.com/package/@clack/prompts) | Terminal UI |
| [execa](https://www.npmjs.com/package/execa) | Command execution |

## License

MIT

## Author

David Übelacker

## Contributing

Issues and pull requests are welcome at [github.com/uebelack/tossitin](https://github.com/uebelack/tossitin)

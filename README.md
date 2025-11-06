# TossItIn 🚀

AI-powered git commit message generator that automatically analyzes your changes, creates meaningful commit messages, and pushes to your repository.

Built with [LangGraph](https://langchain-ai.github.io/langgraph/) and [Claude](https://www.anthropic.com/claude) (Anthropic).

## Features

- 🤖 **AI-Powered Analysis**: Uses Claude to understand your code changes
- 📝 **Smart Commit Messages**: Generates subject lines with emojis and detailed descriptions
- 🔄 **Full Automation**: Stages, commits, and pushes in one command
- 🛠️ **Tool-Based Workflow**: AI inspects git state using `git status` and `git diff`
- ⚡ **Simple**: One command to go from changes to pushed commits

## Installation

### Global Installation (Recommended)

```bash
npm install -g tossitin
```

### Run Without Installing

```bash
npx tossitin
```

### Local Installation

```bash
npm install tossitin
```

## Requirements

- Node.js v22 or higher
- Git repository initialized
- Anthropic API key ([get one here](https://console.anthropic.com/))

## Setup

Set your Anthropic API key as an environment variable:

```bash
export ANTHROPIC_API_KEY=your_api_key_here
```

To make it permanent, add to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
echo 'export ANTHROPIC_API_KEY=your_api_key_here' >> ~/.zshrc
```

## Usage

1. Make changes to your code
2. Run tossitin in your git repository:

```bash
tossitin
```

That's it! The tool will:

1. Stage all changes (`git add .`)
2. Analyze the changes using AI
3. Generate a commit message with subject and description
4. Commit the changes
5. Push to your remote repository

### Example Output

```
┌  Let's toss it in! 🚀
│
◇  Adding files
◇  Executing command: git status
◇  Executing command: git diff --cached
◇  Committing with subject: ✨ Add README and improve workflow
│  and description: Added comprehensive documentation and improved
│  the workflow with early exit check for empty repositories
◇  Commit result: [main 9145851] ✨ Add README and improve workflow
◇  Pushing
│
└  🎉 everything committed and pushed! 🎉
```

## How It Works

TossItIn uses a [LangGraph](https://langchain-ai.github.io/langgraph/) state machine workflow:

1. **Stage Changes**: Automatically runs `git add .`
2. **Check for Changes**: Validates there are changes to commit
3. **AI Analysis**: Claude inspects repository state using git commands
4. **Generate Message**: Creates a structured commit message (subject + description)
5. **Commit**: Commits with the generated message
6. **Push**: Pushes to remote repository

The AI has access to a tool that can execute git commands, allowing it to inspect `git status` and `git diff --cached` to understand exactly what changed.

## Development

### Clone and Install

```bash
git clone https://github.com/uebelack/tossitin.git
cd tossitin
npm install
```

### Link for Local Testing

```bash
npm link
tossitin  # Test from any directory
```

### Run Directly

```bash
node index.mjs
```

## Troubleshooting

**Nothing to commit**: Make sure you have uncommitted changes before running tossitin.

**Missing API key**: Ensure `ANTHROPIC_API_KEY` is set in your environment:

```bash
echo $ANTHROPIC_API_KEY  # Should display your key
```

**Permission denied**: If you get a permission error, make sure index.mjs is executable:

```bash
chmod +x index.mjs
```

## Architecture

Built with:

- **[@langchain/langgraph](https://www.npmjs.com/package/@langchain/langgraph)**: State machine workflow orchestration
- **[@langchain/anthropic](https://www.npmjs.com/package/@langchain/anthropic)**: Claude AI integration
- **[@clack/prompts](https://www.npmjs.com/package/@clack/prompts)**: Beautiful terminal UI
- **[execa](https://www.npmjs.com/package/execa)**: Command execution

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation.

## License

MIT

## Author

David Übelacker

## Contributing

Issues and pull requests are welcome at [github.com/uebelack/tossitin](https://github.com/uebelack/tossitin)

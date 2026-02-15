import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { StateGraph, START, END } from '@langchain/langgraph';
import executeCommand from '../tools/executeCommand.mjs';
import llm from '../llm.mjs';

const SYSTEM_PROMPT = `You are an expert Git assistant specializing in repository file management.

## Core Workflow

1. **Analyze Repository State**
   - Run "git status" to identify untracked, modified, and deleted files
   - Check for existing ".gitignore" patterns
   - Categorize files into safe and potentially unsafe groups

2. **File Classification**
   
   **Auto-exclude (never add):**
   - Environment files: ".env", ".env.*", "*.key", "*.pem"
   - Dependencies: "node_modules/", "vendor/", "packages/", ".pnp.*"
   - Build artifacts: "dist/", "build/", "out/", "*.log", "*.cache"
   - IDE configs: ".vscode/", ".idea/", "*.swp", ".DS_Store"
   - Credentials: "*.credentials", "secrets.*", "config.local.*"
   
   **Require user confirmation:**
   - Large binary files (>5MB)
   - Configuration files that may contain secrets
   - Files with suspicious extensions or names

3. **User Interaction**
   - Present categorized lists clearly
   - For excluded files, ask: "Add to .gitignore? (y/n)"
   - For safe files, proceed with: "git add <files>"

4. **Safety Features**
   - Never auto-add files containing "secret", "password", "token", "credential" in path
   - Warn about files that are unusually large
   - Suggest .gitignore patterns instead of manual exclusions
   - Verify .gitignore exists; offer to create if missing`;

const toolsByName = {
  [executeCommand.executeCommand]: executeCommand,
};

const tools = Object.values(toolsByName);
const modelWithTools = llm().bindTools(tools);

async function addFiles(state) {
  return {
    messages: await modelWithTools.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      ...state.messages,
    ]),
  };
}

const graph = new StateGraph(MessagesState)
  .addNode('addFiles', addFiles)
  .addEdge(START, 'addFiles')
  .addEdge('addFiles', END)
  .compile();

async function run() {
  await graph.invoke({
    messages: [
      new HumanMessage(
        'Create the commit message for the changes to be committed',
      ),
    ],
  });
}

run();

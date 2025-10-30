import { ChatAnthropic } from '@langchain/anthropic';
import { execaCommand } from 'execa';
import { intro, outro, log } from '@clack/prompts';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { MessagesZodMeta } from '@langchain/langgraph';
import { registry } from '@langchain/langgraph/zod';
import { StateGraph, START, END } from '@langchain/langgraph';
import { tool } from '@langchain/core/tools';
import { isAIMessage, ToolMessage } from '@langchain/core/messages';
import * as z from 'zod';

const model = new ChatAnthropic({
  model: 'claude-sonnet-4-5',
});

const execute = tool(
  async ({ command }) => {
    log.info(`Executing command: ${command}`);
    const { all } = await execaCommand(command, { shell: true, all: true });
    return all;
  },
  {
    name: 'execute',
    description: 'Execute a command line command',
    schema: z.object({
      command: z.string().describe('Command to execute'),
    }),
  }
);

const toolsByName = {
  [execute.name]: execute,
};

const tools = Object.values(toolsByName);
const modelWithTools = model.bindTools(tools);

const MessagesState = z.object({
  messages: z.array(z.any()).register(registry, MessagesZodMeta),
});

async function generateCommitMessage(state) {
  return {
    messages: await modelWithTools.invoke([
      new SystemMessage(
        `You are a helpful assistant that generates commit messages for a git repository. 
        Please use the tools to execute needed git commands to find the changes to be committed. 
        You should then return a commit message that describes the changes in a way that is easy to understand.
        Please use emojis to make the commit message more engaging.`
      ),
      ...state.messages,
    ]),
  };
}

async function toolNode(state) {
  const lastMessage = state.messages.at(-1);

  if (lastMessage == null || !isAIMessage(lastMessage)) {
    return { messages: [] };
  }

  const result = [];
  for (const toolCall of lastMessage.tool_calls ?? []) {
    const tool = toolsByName[toolCall.name];
    const observation = await tool.invoke(toolCall);
    result.push(new ToolMessage(observation));
  }

  return { messages: [...state.messages, ...result] };
}

async function shouldContinue(state) {
  const lastMessage = state.messages.at(-1);
  if (lastMessage == null || !isAIMessage(lastMessage)) return END;

  // If the LLM makes a tool call, then perform an action
  if (lastMessage.tool_calls?.length) {
    return 'toolNode';
  }

  // Otherwise, we stop (reply to the user)
  return END;
}

const graph = new StateGraph(MessagesState)
  .addNode('generateCommitMessage', generateCommitMessage)
  .addNode('toolNode', toolNode)
  .addEdge(START, 'generateCommitMessage')
  .addConditionalEdges('generateCommitMessage', shouldContinue, [
    'toolNode',
    END,
  ])
  .addEdge('toolNode', 'generateCommitMessage')
  .compile();

async function run() {
  const result = await graph.invoke({
    messages: [
      new HumanMessage(
        'Create the initial commit message for the changes to be committed'
      ),
    ],
  });
  console.log(result.messages.at(-1).content);
}

run();

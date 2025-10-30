import { ChatAnthropic } from '@langchain/anthropic';
import { execa, execaCommand } from 'execa';
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
    schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to execute' },
      },
      required: ['command'],
      additionalProperties: false,
    },
  }
);

const toolsByName = {
  [execute.name]: execute,
};

const tools = Object.values(toolsByName);
const modelWithTools = model.bindTools(tools);

const MessagesState = z.object({
  messages: z.array(z.any()).register(registry, MessagesZodMeta),
  subject: z.string().optional(),
  description: z.string().optional(),
});

async function addFiles(state) {
  const result = await execa('git', ['add', '.']);
  log.info(`Add files result: ${result.stdout ?? ''}`);
  return {};
}

async function generateCommitMessage(state) {
  return {
    messages: await modelWithTools.invoke([
      new SystemMessage(
        `You are a helpful assistant that generates commit messages for a git repository. 
        Please use the tools to execute needed git commands to find the changes to be committed. 
        You should then return a commit message that describes the changes in a way that is easy to understand.`
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

  if (lastMessage.tool_calls?.length) {
    return 'toolNode';
  }

  return 'structureCommitMessage';
}

async function structureCommitMessage(state) {
  const outputSchema = {
    type: 'object',
    properties: {
      subject: {
        type: 'string',
        description: 'The subject of the commit message',
      },
      description: {
        type: 'string',
        description: 'The description of the commit message',
      },
    },
    required: ['subject', 'description'],
    additionalProperties: false,
  };
  const modelWithStructure = model.withStructuredOutput(outputSchema);

  const result = await modelWithStructure.invoke([
    new SystemMessage(
      'You are a helpful assistant that structures a commit message for a git repository.'
    ),
    state.messages[state.messages.length - 1],
  ]);

  return {
    subject: result.subject,
    description: result.description,
  };
}

async function commit(state) {
  log.info(
    `Committing with subject: ${state.subject} and description: ${state.description}`
  );
  const result = await execa('git', [
    'commit',
    '-m',
    state.subject ?? '',
    '-m',
    state.description ?? '',
  ]);
  log.info(`Commit result: ${result.stdout ?? ''}`);
  return {};
}

const graph = new StateGraph(MessagesState)
  .addNode('addFiles', addFiles)
  .addNode('generateCommitMessage', generateCommitMessage)
  .addNode('toolNode', toolNode)
  .addNode('structureCommitMessage', structureCommitMessage)
  .addNode('commit', commit)
  .addEdge(START, 'addFiles')
  .addEdge('addFiles', 'generateCommitMessage')
  .addConditionalEdges('generateCommitMessage', shouldContinue, [
    'toolNode',
    'structureCommitMessage',
  ])
  .addEdge('toolNode', 'generateCommitMessage')
  .addEdge('structureCommitMessage', 'commit')
  .addEdge('commit', END)
  .compile();

async function run() {
  const result = await graph.invoke({
    messages: [
      new HumanMessage(
        'Create the initial commit message for the changes to be committed'
      ),
    ],
  });
}

run();

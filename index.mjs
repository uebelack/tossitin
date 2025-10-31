#!/usr/bin/env node
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

// Check for ANTHROPIC_API_KEY
if (!process.env.ANTHROPIC_API_KEY) {
  intro("Let's toss it in! 🚀");
  outro('❌ ANTHROPIC_API_KEY environment variable is required. Please set it and try again.');
  process.exit(1);
}

intro("Let's toss it in! 🚀");

const model = new ChatAnthropic({
  model: 'claude-sonnet-4-5',
});

const execute = tool(
  async ({ command }) => {
    log.info(`Executing command: ${command}`);
    try {
      const { all } = await execaCommand(command, { shell: true, all: true });
      return all;
    } catch (error) {
      // Log the error for debugging
      log.error(`Command failed: ${command}`);
      log.error(`Error: ${error.message}`);

      // Return error information to the LLM so it can try a different approach
      const errorMessage = `Command failed with exit code ${error.exitCode}: ${command}\n\nError: ${error.stderr || error.message}\n\nTip: If using git commands with options and file paths, make sure options (like --stat) come before file paths (like index.mjs).`;
      return errorMessage;
    }
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

async function checkNothingToCommit(state) {
  const { stdout } = await execa('git', ['status', '--porcelain']);
  if ((stdout ?? '').trim().length === 0) {
    outro('🛑 Nothing to commit. Exiting...');
  }
  return { ...state };
}

async function continueAfterCheck() {
  const { stdout } = await execa('git', ['status', '--porcelain']);
  return (stdout ?? '').trim().length === 0 ? END : 'generateCommitMessage';
}

async function addFiles(state) {
  log.info(`Adding files`);
  await execa('git', ['add', '.']);
  return {};
}

async function generateCommitMessage(state) {
  return {
    messages: await modelWithTools.invoke([
      new SystemMessage(
        `You are a helpful assistant that generates commit messages for a git repository. 
        Please use the tools to execute needed git commands to find the changes to be committed. 
        You should then return a commit message that describes the changes in a way that is easy to understand.
        If nothing is changed, return "Nothing to commit".`
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
      'You are a helpful assistant that structures a commit message for a git repository and adds an emoji in front of the subject.'
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

async function push(state) {
  log.info('Pushing');
  const result = await execa('git', ['push']);
  log.info(`Push result: ${result.stdout ?? ''}`);
  outro('🎉 everything committed and pushed! 🎉');
  return {};
}

const graph = new StateGraph(MessagesState)
  .addNode('addFiles', addFiles)
  .addNode('checkNothingToCommit', checkNothingToCommit)
  .addNode('generateCommitMessage', generateCommitMessage)
  .addNode('toolNode', toolNode)
  .addNode('structureCommitMessage', structureCommitMessage)
  .addNode('commit', commit)
  .addNode('push', push)
  .addEdge(START, 'addFiles')
  .addEdge('addFiles', 'checkNothingToCommit')
  .addConditionalEdges('checkNothingToCommit', continueAfterCheck, [
    'generateCommitMessage',
    END,
  ])
  .addConditionalEdges('generateCommitMessage', shouldContinue, [
    'toolNode',
    'structureCommitMessage',
  ])
  .addEdge('toolNode', 'generateCommitMessage')
  .addEdge('structureCommitMessage', 'commit')
  .addEdge('commit', 'push')
  .addEdge('push', END)
  .compile();

async function run() {
  const result = await graph.invoke({
    messages: [
      new HumanMessage(
        'Create the commit message for the changes to be committed'
      ),
    ],
  });
}

run();

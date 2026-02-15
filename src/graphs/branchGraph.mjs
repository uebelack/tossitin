import { StateGraph, START, END } from '@langchain/langgraph';
import execute from '../utils/execute.mjs';
import * as z from 'zod';
import config from '../config.mjs';
import { log } from '@clack/prompts';
import { getJiraIssuesInProgress } from '../integrations/jira.mjs';

const BranchState = z.object({
  currentBranchName: z.string(),
});

async function readCurrentBranchName(state) {
  const result = await execute('git rev-parse --abbrev-ref HEAD');
  return { currentBranchName: result.trim() };
}

async function shouldCreateBranch(state) {
  const protectedBranches = config.protectedBranches || [];
  const isProtected = protectedBranches.some((branch) => {
    if (branch.endsWith('/')) {
      return state.currentBranchName.startsWith(branch);
    }
    return state.currentBranchName === branch;
  });
  return isProtected ? 'createNewBranch' : END;
}

async function createNewBranch(state) {
  log.info(
    `✋ current branch ${state.currentBranchName} is protected, let's create a new branch...`,
  );

  if (config.jira) {
    const issuesInProgress = await getJiraIssuesInProgress();
    console.log('Issues in progress:', JSON.stringify(issuesInProgress));
  }
}

const graph = new StateGraph(BranchState)
  .addNode('readCurrentBranchName', readCurrentBranchName)
  .addNode('createNewBranch', createNewBranch)
  .addEdge(START, 'readCurrentBranchName')
  .addConditionalEdges('readCurrentBranchName', shouldCreateBranch, [
    'createNewBranch',
    END,
  ])
  .addEdge('createNewBranch', END)
  .compile();

export default graph;

import { log, text, spinner } from '@clack/prompts';
import execute from './utils/execute.mjs';
import config from './config.mjs';
import llm from './llm.mjs';
import parseResult from './utils/parseResult.mjs';
import { getBranchInstructionsFromJira } from './integrations/jira.mjs';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

function isBranchProtected(branchName) {
  const protectedBranches = config.protectedBranches || [];
  return protectedBranches.some((branch) => {
    if (branch.endsWith('/')) {
      return branchName.startsWith(branch);
    }
    return branchName === branch;
  });
}

async function createNewBranch(force) {
  log.info(`🔐 Current branch is protected, let's create a new branch...`);

  var instructions = await getBranchInstructionsFromJira();

  if (!instructions) {
    instructions = await text({
      message: '🙋‍♀️ How would you describe the branch you want to create?',
    });
  }

  const s = spinner();
  s.start('🧠 Thinking...');

  const result = await llm().invoke([
    new SystemMessage(config.prompts.createBranch),
    new HumanMessage(
      `Create a git branch name with the following instructions: ${instructions}`,
    ),
  ]);

  const newBranchName = parseResult(result);

  s.stop(`👌 Perfect branch name: ${newBranchName}`);

  if (force == true) {
    await execute(`git checkout -b ${newBranchName}`);
  } else {
    const command = await text({
      message: 'Should I create the branch and execute this command?',
      initialValue: `git checkout -b ${newBranchName}`,
    });

    await execute(command);
  }

  return newBranchName;
}

async function branch(state) {
  var currentBranchName = (
    await execute('git rev-parse --abbrev-ref HEAD')
  ).trim();

  if (isBranchProtected(currentBranchName)) {
    currentBranchName = await createNewBranch(state.force);
  } else {
    log.info(
      `✅ Current branch "${currentBranchName}" is not protected, let's continue...`,
    );
  }

  return {
    ...state,
    currentBranchName,
  };
}

export default branch;

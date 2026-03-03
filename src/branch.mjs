import { log, text, spinner, isCancel, cancel } from "@clack/prompts";
import execute from "./utils/execute.mjs";
import config from "./config.mjs";
import llm from "./llm.mjs";
import extractResult from "./utils/extractResult.mjs";
import { getBranchInstructionsFromJira } from "./integrations/jira.mjs";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

function isBranchProtected(branchName) {
  const protectedBranches = config.protectedBranches || [];
  return protectedBranches.some((branch) => {
    if (branch.endsWith("/")) {
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
      message: "🙋‍♀️ How would you describe the branch you want to create?",
    });

    if (isCancel(instructions)) {
      cancel("❌ Cancelled.");
      process.exit(0);
    }
  }

  const s = spinner();
  s.start("🧠 Thinking...");

  const result = await llm().invoke([
    new SystemMessage(config.prompts.createBranch),
    new HumanMessage(
      `Create a git branch name with the following instructions: ${instructions}`,
    ),
  ]);

  const newBranchName = extractResult(result);

  s.stop(`👌 Perfect branch name: ${newBranchName}`);

  if (force == true) {
    await execute(`git checkout -b ${newBranchName}`);
  } else {
    const command = await text({
      message: "Should I create the branch and execute this command?",
      initialValue: `git checkout -b ${newBranchName}`,
    });

    if (isCancel(command)) {
      cancel("❌ Cancelled.");
      process.exit(0);
    }

    await execute(command);
  }

  return newBranchName;
}

async function branch(force) {
  var currentBranchName = (await execute("git branch --show-current")).trim();

  if (isBranchProtected(currentBranchName)) {
    await createNewBranch(force);
  } else {
    log.info(
      `✅ Current branch "${currentBranchName}" is not protected, let's continue...`,
    );
  }
}

export default branch;

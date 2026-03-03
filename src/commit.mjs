import { createAgent } from "langchain";
import llm from "./llm.mjs";
import executeCommand from "./tools/executeCommand.mjs";
import config from "./config.mjs";
import { log, confirm, isCancel, cancel } from "@clack/prompts";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import execute from "./utils/execute.mjs";
import extractResult from "./utils/extractResult.mjs";
import * as z from "zod";

const CommitMessage = z.object({
  title: z.string(),
  description: z.string(),
});

async function commit(force) {
  log.info("🎉 Checking for files to commit...");
  const filesToCommit = (await execute("git status -s"))
    .trim()
    .split("\n")
    .filter((line) => line && !line.startsWith("?"))
    .map((line) => line.trim().split(" ")[1]);

  if (filesToCommit.length > 0) {
    log.info("🧠 Creating commit message...");

    const agent = createAgent({
      model: llm(),
      tools: [executeCommand],
    });

    const rawResult = await agent.invoke({
      messages: [{ role: "user", content: config.prompts.commitPrompt }],
    });

    const result = extractResult(rawResult);

    const commitMessage = await (await llm())
      .withStructuredOutput(CommitMessage)
      .invoke([
        new SystemMessage(config.prompts.extractCommitMessagePrompt),
        new HumanMessage(result),
      ]);

    log.info(`👌 Commit message:\n\n${commitMessage}\n\n`);

    const shouldCommit =
      force ||
      (await confirm({
        message: "Should I commit with this message?",
      }));

    if (isCancel(shouldCommit)) {
      cancel("❌ Cancelled.");
      process.exit(0);
    }

    if (shouldCommit) {
      await execute(`git commit -m "${commitMessage}"`);
    } else {
      process.exit(0);
    }
  } else {
    log.info("👌 No files to commit, exiting.");
    process.exit(0);
  }
}

export default commit;

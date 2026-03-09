import { createAgent } from "langchain";
import llm from "./llm.mjs";
import executeCommand from "./tools/executeCommand.mjs";
import config from "./config.mjs";
import { log, confirm, isCancel, cancel, spinner, text } from "@clack/prompts";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import execute from "./utils/execute.mjs";
import extractResult from "./utils/extractResult.mjs";
import * as z from "zod";

const CommitMessage = z.object({
  title: z.string(),
  description: z.string(),
});

async function commit() {
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

    const s = spinner();
    s.start("🧠 Thinking...");

    const commitMessage = await (await llm())
      .withStructuredOutput(CommitMessage)
      .invoke([
        new SystemMessage(config.prompts.extractCommitMessagePrompt),
        new HumanMessage(result),
      ]);

    s.stop();

    var title = commitMessage.title;

    if (!config.force) {
      title = await text({
        message: "Should I use this title for the commit message?",
        initialValue: commitMessage.title,
      });

      if (isCancel(title)) {
        cancel("❌ Cancelled.");
        process.exit(0);
      }
    }

    const shouldAddDescription =
      config.force ||
      (await confirm({
        message:
          "Should I add this description to the commit message?\n\n" +
          commitMessage.description,
      }));

    if (isCancel(shouldAddDescription)) {
      cancel("❌ Cancelled.");
      process.exit(0);
    }

    if (shouldAddDescription) {
      await execute(
        `git commit -m "${title}" -m "${commitMessage.description}"`,
      );
    } else {
      await execute(`git commit -m "${title}"`);
    }
  } else {
    log.info("👌 No files to commit, exiting.");
    process.exit(0);
  }
}

export default commit;

import { createAgent } from "langchain";
import llm from "./llm.mjs";
import executeCommand from "./tools/executeCommand.mjs";
import config from "./config.mjs";
import { log, confirm } from "@clack/prompts";
import execute from "./utils/execute.mjs";

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

    const result = await agent.invoke({
      messages: [{ role: "user", content: config.prompts.commitPrompt }],
    });

    const commitMessage = result.messages[result.messages.length - 1].content;

    log.info(`👌 Commit message:\n\n${commitMessage}\n\n`);

    const shouldCommit =
      force ||
      (await confirm({
        message: "Should I commit with this message?",
      }));

    if (shouldCommit) {
      await execute(`git commit -m "${commitMessage}"`);
      log.info(`👌 Committed with message:\n\n${commitMessage}\n\n`);
    }
  } else {
    log.info("👌 No files to commit, exiting.");
  }
}

export default commit;

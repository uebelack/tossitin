import { log, spinner, outro } from "@clack/prompts";
import execute from "./utils/execute.mjs";
import llm from "./llm.mjs";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import config from "./config.mjs";
import * as z from "zod";

const DangerousFile = z.object({
  filename: z.string(),
  reason: z.string(),
});

const DangerousFiles = z.object({
  dangerousFiles: z.array(DangerousFile),
});

async function add() {
  log.info(`🎉 Checking for new files to add...`);

  const filesToAdd = (await execute("git status -s"))
    .split("\n")
    .filter((line) => line.startsWith("??"))
    .map((line) => line.trim().split(" ")[1]);

  if (filesToAdd.length > 0) {
    const s = spinner();
    s.start("🧠 Thinking...");

    const result = await (await llm())
      .withStructuredOutput(DangerousFiles)
      .invoke([
        new SystemMessage(config.prompts.addPrompt),
        new HumanMessage(filesToAdd.join("\n")),
      ]);

    s.stop();

    if (result.dangerousFiles.length > 0) {
      log.error(
        `❌ The following files are dangerous and should not be added:\n\n${result.dangerousFiles.map((file) => `\t👉 ${file.filename} - ${file.reason}`).join("\n")}`,
      );
      outro(
        "Please review the files and add them to the .gitignore, delete them or add them manually.",
      );
      process.exit(0);
    }

    log.info(
      `🎉 Adding files:\n\n${filesToAdd.map((file) => `\t👉 ${file}`).join("\n")}`,
    );
  }

  await execute("git add .");
}

export default add;

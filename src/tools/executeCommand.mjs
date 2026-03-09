import { tool } from "@langchain/core/tools";
import { execaCommand } from "execa";
import { log } from "@clack/prompts";
import config from "../config.mjs";

const executeCommand = tool(
  async ({ command }) => {
    log.info(`Executing command: ${command}`);
    try {
      const { all } = await execaCommand(command, { shell: true, all: true });

      let result = all.trim();

      if (result.length > 10000) {
        result = result.slice(0, 10000) + "\n\n...truncated...";
      }

      if (config.debug) {
        log.info(`Command output: ${result}`);
      }

      return result;
    } catch (error) {
      log.error(`Command failed: ${command}`);
      const errorMessage = `Command failed with exit code ${
        error.exitCode
      }: ${command}\n\nError: ${
        error.stderr || error.message
      }\n\nTip: If using git commands with options and file paths, make sure options (like --stat) come before file paths (like index.mjs).`;

      if (config.debug) {
        log.info(`Command error: ${errorMessage}`);
      }

      return errorMessage;
    }
  },
  {
    name: "execute",
    description: "Execute a command line command",
    schema: {
      type: "object",
      properties: {
        command: { type: "string", description: "Command to execute" },
      },
      required: ["command"],
      additionalProperties: false,
    },
  },
);

export default executeCommand;

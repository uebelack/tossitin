import { tool } from '@langchain/core/tools';
import { execaCommand } from 'execa';
import { log } from '@clack/prompts';

const executeCommand = tool(
  async ({ command }) => {
    log.info(`Executing command: ${command}`);
    try {
      const { all } = await execaCommand(command, { shell: true, all: true });
      return all;
    } catch (error) {
      log.error(`Command failed: ${command}`);
      const errorMessage = `Command failed with exit code ${
        error.exitCode
      }: ${command}\n\nError: ${
        error.stderr || error.message
      }\n\nTip: If using git commands with options and file paths, make sure options (like --stat) come before file paths (like index.mjs).`;
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
  },
);

export default executeCommand;

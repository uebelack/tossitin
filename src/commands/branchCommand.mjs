import { intro, text, spinner, outro } from "@clack/prompts";
import llm from "../llm.mjs";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import parseResult from "../utils/parseResult.mjs";
import { execaCommand } from "execa";

const SYSTEM_PROMPT = `You are an expert git assistant that helps users create perfect branch names based on a short description of the branch's purpose.
The branch name should be concise, use hyphens to separate words, and follow best practices for git branch naming conventions. Avoid using special characters or spaces. Focus on clarity and brevity.
As input you will receive a short description of the branch's purpose, and you should generate an appropriate branch name based on that description.
If not mentioned if it is a feature, bugfix, or hotfix branch, default to feature.
Please prefix the branch name accordingly with 'feature/', 'bugfix/', or 'hotfix/' based on the context provided.
If the description contains a ticket number (e.g., ABC-123), include it in the branch name after the prefix in case provided.
Example branch names:

- feature/ABC-123-add-user-authentication
- bugfix/XYZ-456-fix-login-issue
- hotfix/URGENT-789-patch-security-vulnerability

Add a really short descriptions after the ticket number, if presented.
Please only respond with the branch name, without any additional explanations or formatting.`;

async function branchCommand(userInput, force = false) {
  intro("🪄 let's create the perfect branch name");

  if (!userInput) {
    userInput = await text({
      message: "How would you describe the branch you want to create?",
    });
  }

  const s = spinner();
  s.start("Thinking...");

  const result = await llm().invoke([
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(
      `Create a git branch name for the following description: ${userInput}`
    ),
  ]);

  const parsedResult = parseResult(result);

  s.stop(`Perfect branch name: ${parsedResult}`);

  if (force == true) {
    await execaCommand(`git checkout -b ${parsedResult}`);
  } else {
    const command = await text({
      message: "Should I create the branch and execute this command?",
      initialValue: `git checkout -b ${parsedResult}`,
    });

    await execaCommand(command);
  }

  outro(`🚀 Your branch has been created with the name: ${parsedResult}`);
}

export default branchCommand;

import { log } from "@clack/prompts";
import execute from "./utils/execute.mjs";

async function push() {
  log.info("🎉 Pushing to remote...");
  try {
    await execute("git push");
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    const branch = (await execute("git rev-parse --abbrev-ref HEAD")).trim();
    log.info(`🧭 No upstream branch. Setting origin/${branch}...`);
    await execute(`git push --set-upstream origin ${branch}`);
  }
  log.info("👌 Pushed to remote.");
}

export default push;

#!/usr/bin/env node
import { intro, outro, log } from "@clack/prompts";
import branch from "./src/branch.mjs";
import add from "./src/add.mjs";
import commit from "./src/commit.mjs";
import push from "./src/push.mjs";
import config from "./src/config.mjs";

async function run() {
  intro("🪄 LET's ToSS IT iN! 💥");

  config.force = process.argv.includes("--force") || config.force;
  config.debug = process.argv.includes("--debug") || config.debug;

  if (config.debug) {
    log.info("🐞 Debug mode enabled");
    log.info("⚙️ Current configuration:\n" + JSON.stringify(config, null, 2));
  }

  await branch();
  await add();
  await commit();
  await push();

  outro("👌 Everything committed and pushed!");
}

run();

#!/usr/bin/env node
import { intro, outro } from "@clack/prompts";
import branch from "./src/branch.mjs";
import add from "./src/add.mjs";
import commit from "./src/commit.mjs";
import push from "./src/push.mjs";

async function run() {
  intro("🪄 LET's ToSS IT iN! 💥");

  const force = process.argv.includes("--force");

  await branch(force);
  await add(force);
  await commit(force);
  await push();

  outro("👌 Everything committed and pushed!");
}

run();

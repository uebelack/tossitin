#!/usr/bin/env node
import { intro } from "@clack/prompts";
import branch from "./src/branch.mjs";

var state = {
  continue: true,
  force: false,
};

async function run() {
  intro("🪄 LET's ToSS IT iN! 💥");

  state = await branch(state);

  console.log(state);
}

run();

#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import branch from "./src/commands/branchCommand.mjs";
import selectCommand from "./src/commands/selectCommand.mjs";

yargs()
  .scriptName("tossitin")
  .usage("$0 <cmd> [args]")
  .option("force", {
    describe: "automatically execute commands without prompts",
    type: "boolean",
  })
  .command(
    "branch [input]",
    "use free input text to create perfect branch name",
    (yargs) => {
      yargs.positional("input", {
        type: "string",
        describe: "the name to say hello to",
      });
    },
    async (argv) => {
      return branch(argv.input, argv.force);
    }
  )
  .command(
    "*",
    "interactive command selection",
    () => {},
    async () => {
      return selectCommand();
    }
  )
  .help()
  .parse(hideBin(process.argv));

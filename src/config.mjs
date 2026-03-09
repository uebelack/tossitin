import fs from "fs";
import createBranchPrompt from "./prompts/createBranchPrompt.mjs";
import addPrompt from "./prompts/addPrompt.mjs";
import commitPrompt from "./prompts/commitPrompt.mjs";
import extractCommitMessagePrompt from "./prompts/extractCommitMessagePrompt.mjs";

const config = {
  force: false,
  debug: false,
  protectedBranches: ["main", "master", "release/", "develop", "development"],
  prompts: {
    createBranch: createBranchPrompt,
    addPrompt: addPrompt,
    commitPrompt: commitPrompt,
    extractCommitMessagePrompt: extractCommitMessagePrompt,
  },
};

const homeDirectory = process.env.HOME;
const currentDirectory = process.cwd();

/* istanbul ignore next */
if (fs.existsSync(`${homeDirectory}/.tossitin/config.mjs`)) {
  const userConfig = await import(`${homeDirectory}/.tossitin/config.mjs`);
  Object.assign(config, userConfig.default);
}

/* istanbul ignore next */
if (fs.existsSync(`${currentDirectory}/.tossitin.config.mjs`)) {
  const userConfig = await import(`${currentDirectory}/.tossitin.config.mjs`);
  Object.assign(config, userConfig.default);
}

export default config;

/* eslint-disable no-undef */
import fs from "fs";
import createBranchPrompt from "./prompts/createBranchPrompt.mjs";

const config = {
  protectedBranches: ["main", "master", "release/", "develop", "development"],
  prompts: {
    createBranch: createBranchPrompt,
  },
};

const homeDirectory = process.env.HOME || process.env.USERPROFILE;
const currentDirectory = process.cwd();

if (fs.existsSync(`${homeDirectory}/.tossitin/config.mjs`)) {
  const userConfig = await import(`${homeDirectory}/.tossitin/config.mjs`);
  Object.assign(config, userConfig.default);
}

if (fs.existsSync(`${currentDirectory}/.tossitin.config.mjs`)) {
  const userConfig = await import(`${currentDirectory}/.tossitin.config.mjs`);
  Object.assign(config, userConfig.default);
}

export default config;

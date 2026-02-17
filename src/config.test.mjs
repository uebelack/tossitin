import { jest } from "@jest/globals";
import fs from "fs";
import path from "path";

const homeDir = process.env.HOME || process.env.USERPROFILE;
const homeConfigDir = path.join(homeDir, ".tossitin");
const homeConfigPath = path.join(homeConfigDir, "config.mjs");
const homeConfigExisted = fs.existsSync(homeConfigPath);

beforeEach(() => {
  jest.resetModules();
});

afterAll(() => {
  if (!homeConfigExisted) {
    if (fs.existsSync(homeConfigPath)) fs.unlinkSync(homeConfigPath);
    if (
      fs.existsSync(homeConfigDir) &&
      fs.readdirSync(homeConfigDir).length === 0
    ) {
      fs.rmdirSync(homeConfigDir);
    }
  }
});

describe("config", () => {
  it("should export default config when no config files exist", async () => {
    jest.unstable_mockModule("fs", () => ({
      default: { existsSync: () => false },
    }));
    jest.unstable_mockModule("./prompts/createBranchPrompt.mjs", () => ({
      default: "mock create branch prompt",
    }));
    jest.unstable_mockModule("./prompts/addPrompt.mjs", () => ({
      default: "mock add prompt",
    }));
    jest.unstable_mockModule("./prompts/commitPrompt.mjs", () => ({
      default: "mock commit prompt",
    }));

    const { default: config } = await import("./config.mjs");

    expect(config.force).toBe(false);
    expect(config.protectedBranches).toEqual(
      expect.arrayContaining(["main", "master", "develop"]),
    );
    expect(config.prompts).toEqual({
      createBranch: "mock create branch prompt",
      addPrompt: "mock add prompt",
      commitPrompt: "mock commit prompt",
    });
  });

  it("should merge project config when .tossitin.config.mjs exists", async () => {
    const cwd = process.cwd();

    jest.unstable_mockModule("fs", () => ({
      default: {
        existsSync: (p) => p === `${cwd}/.tossitin.config.mjs`,
      },
    }));
    jest.unstable_mockModule("./prompts/createBranchPrompt.mjs", () => ({
      default: "prompt",
    }));
    jest.unstable_mockModule("./prompts/addPrompt.mjs", () => ({
      default: "prompt",
    }));
    jest.unstable_mockModule("./prompts/commitPrompt.mjs", () => ({
      default: "prompt",
    }));

    const { default: config } = await import("./config.mjs");

    expect(config.protectedBranches).toEqual([]);
    expect(config.force).toBe(false);
  });

  it("should check both home and cwd config paths", async () => {
    const cwd = process.cwd();
    const checkedPaths = [];

    jest.unstable_mockModule("fs", () => ({
      default: {
        existsSync: (p) => {
          checkedPaths.push(p);
          return false;
        },
      },
    }));
    jest.unstable_mockModule("./prompts/createBranchPrompt.mjs", () => ({
      default: "prompt",
    }));
    jest.unstable_mockModule("./prompts/addPrompt.mjs", () => ({
      default: "prompt",
    }));
    jest.unstable_mockModule("./prompts/commitPrompt.mjs", () => ({
      default: "prompt",
    }));

    await import("./config.mjs");

    expect(checkedPaths).toContain(`${homeDir}/.tossitin/config.mjs`);
    expect(checkedPaths).toContain(`${cwd}/.tossitin.config.mjs`);
  });
});

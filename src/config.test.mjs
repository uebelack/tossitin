import { vi } from "vitest";
import fs from "fs";
import path from "path";

const homeDir = process.env.HOME || process.env.USERPROFILE;
const homeConfigDir = path.join(homeDir, ".tossitin");
const homeConfigPath = path.join(homeConfigDir, "config.mjs");
const homeConfigExisted = fs.existsSync(homeConfigPath);

beforeEach(() => {
  vi.resetModules();
});

afterAll(() => {
  if (!homeConfigExisted) {
    if (fs.existsSync(homeConfigPath)) fs.unlinkSync(homeConfigPath);
    if (fs.existsSync(homeConfigDir) && fs.readdirSync(homeConfigDir).length === 0) {
      fs.rmdirSync(homeConfigDir);
    }
  }
});

describe("config", () => {
  it("should export default config when no config files exist", async () => {
    vi.doMock("fs", () => ({
      default: { existsSync: () => false },
    }));
    vi.doMock("./prompts/createBranchPrompt.mjs", () => ({
      default: "mock create branch prompt",
    }));
    vi.doMock("./prompts/addPrompt.mjs", () => ({
      default: "mock add prompt",
    }));
    vi.doMock("./prompts/commitPrompt.mjs", () => ({
      default: "mock commit prompt",
    }));
    vi.doMock("./prompts/extractCommitMessagePrompt.mjs", () => ({
      default: "mock extract commit message prompt",
    }));

    const { default: config } = await import("./config.mjs");

    expect(config.force).toBe(false);
    expect(config.protectedBranches).toEqual(expect.arrayContaining(["main", "master", "develop"]));
    expect(config.prompts).toEqual({
      createBranch: "mock create branch prompt",
      addPrompt: "mock add prompt",
      commitPrompt: "mock commit prompt",
      extractCommitMessagePrompt: "mock extract commit message prompt",
    });
  });

  it("should check both home and cwd config paths", async () => {
    const cwd = process.cwd();
    const checkedPaths = [];

    vi.doMock("fs", () => ({
      default: {
        existsSync: (p) => {
          checkedPaths.push(p);
          return false;
        },
      },
    }));
    vi.doMock("./prompts/createBranchPrompt.mjs", () => ({
      default: "prompt",
    }));
    vi.doMock("./prompts/addPrompt.mjs", () => ({
      default: "prompt",
    }));
    vi.doMock("./prompts/commitPrompt.mjs", () => ({
      default: "prompt",
    }));
    vi.doMock("./prompts/extractCommitMessagePrompt.mjs", () => ({
      default: "prompt",
    }));

    await import("./config.mjs");

    expect(checkedPaths).toContain(`${homeDir}/.tossitin/config.mjs`);
    expect(checkedPaths).toContain(`${cwd}/.tossitin.config.mjs`);
  });
});

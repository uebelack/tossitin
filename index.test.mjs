import { jest } from "@jest/globals";

const mockIntro = jest.fn();
const mockOutro = jest.fn();
const mockBranch = jest.fn();
const mockAdd = jest.fn();
const mockCommit = jest.fn();
const mockPush = jest.fn();

const mockLog = { info: jest.fn() };

jest.unstable_mockModule("@clack/prompts", () => ({
  intro: mockIntro,
  outro: mockOutro,
  log: mockLog,
}));

jest.unstable_mockModule("./src/branch.mjs", () => ({
  default: mockBranch,
}));

jest.unstable_mockModule("./src/add.mjs", () => ({
  default: mockAdd,
}));

jest.unstable_mockModule("./src/commit.mjs", () => ({
  default: mockCommit,
}));

jest.unstable_mockModule("./src/push.mjs", () => ({
  default: mockPush,
}));

const mockConfig = {
  force: false,
  debug: false,
};

jest.unstable_mockModule("./src/config.mjs", () => ({
  default: mockConfig,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockConfig.force = false;
  mockConfig.debug = false;
});

describe("index", () => {
  it("should run the full workflow", async () => {
    mockBranch.mockResolvedValueOnce();
    mockAdd.mockResolvedValueOnce();
    mockCommit.mockResolvedValueOnce();
    mockPush.mockResolvedValueOnce();

    await import("./index.mjs");

    expect(mockIntro).toHaveBeenCalledWith(expect.stringContaining("ToSS IT"));
    expect(mockBranch).toHaveBeenCalled();
    expect(mockAdd).toHaveBeenCalled();
    expect(mockCommit).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalled();
    expect(mockOutro).toHaveBeenCalledWith(
      expect.stringContaining("committed and pushed"),
    );
  });

  it("should log debug info when debug mode is enabled", async () => {
    mockConfig.debug = true;
    mockBranch.mockResolvedValueOnce();
    mockAdd.mockResolvedValueOnce();
    mockCommit.mockResolvedValueOnce();
    mockPush.mockResolvedValueOnce();

    await jest.isolateModulesAsync(async () => {
      await import("./index.mjs");
    });

    expect(mockLog.info).toHaveBeenCalledWith(
      expect.stringContaining("Debug mode enabled"),
    );
    expect(mockLog.info).toHaveBeenCalledWith(
      expect.stringContaining("Current configuration"),
    );
  });
});

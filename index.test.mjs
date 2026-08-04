import { vi } from "vitest";

const mockIntro = vi.fn();
const mockOutro = vi.fn();
const mockBranch = vi.fn();
const mockAdd = vi.fn();
const mockCommit = vi.fn();
const mockPush = vi.fn();

const mockLog = { info: vi.fn() };

vi.doMock("@clack/prompts", () => ({
  intro: mockIntro,
  outro: mockOutro,
  log: mockLog,
}));

vi.doMock("./src/branch.mjs", () => ({
  default: mockBranch,
}));

vi.doMock("./src/add.mjs", () => ({
  default: mockAdd,
}));

vi.doMock("./src/commit.mjs", () => ({
  default: mockCommit,
}));

vi.doMock("./src/push.mjs", () => ({
  default: mockPush,
}));

const mockConfig = {
  force: false,
  debug: false,
};

vi.doMock("./src/config.mjs", () => ({
  default: mockConfig,
}));

beforeEach(() => {
  vi.clearAllMocks();
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
    expect(mockOutro).toHaveBeenCalledWith(expect.stringContaining("committed and pushed"));
  });

  it("should log debug info when debug mode is enabled", async () => {
    mockConfig.debug = true;
    mockBranch.mockResolvedValueOnce();
    mockAdd.mockResolvedValueOnce();
    mockCommit.mockResolvedValueOnce();
    mockPush.mockResolvedValueOnce();

    vi.resetModules();
    await import("./index.mjs");

    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining("Debug mode enabled"));
    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining("Current configuration"));
  });
});

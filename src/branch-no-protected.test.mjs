import { jest } from "@jest/globals";

const mockLog = { info: jest.fn() };
const mockText = jest.fn();
const mockSpinner = { start: jest.fn(), stop: jest.fn() };
const mockExecute = jest.fn();
const mockInvoke = jest.fn();
const mockLlm = jest.fn(() => ({ invoke: mockInvoke }));
const mockGetBranchInstructionsFromJira = jest.fn();

jest.unstable_mockModule("@clack/prompts", () => ({
  log: mockLog,
  text: mockText,
  spinner: () => mockSpinner,
}));

jest.unstable_mockModule("./utils/execute.mjs", () => ({
  default: mockExecute,
}));

jest.unstable_mockModule("./llm.mjs", () => ({
  default: mockLlm,
}));

jest.unstable_mockModule("./config.mjs", () => ({
  default: {
    prompts: {
      createBranch: "test create branch prompt",
    },
  },
}));

jest.unstable_mockModule("./integrations/jira.mjs", () => ({
  getBranchInstructionsFromJira: mockGetBranchInstructionsFromJira,
}));

const { default: branch } = await import("./branch.mjs");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("branch with no protectedBranches config", () => {
  it("should treat all branches as unprotected when protectedBranches is not configured", async () => {
    mockExecute.mockResolvedValueOnce("main\n");

    await branch(false);

    expect(mockLog.info).toHaveBeenCalledWith(
      expect.stringContaining("not protected"),
    );
    expect(mockLlm).not.toHaveBeenCalled();
  });
});

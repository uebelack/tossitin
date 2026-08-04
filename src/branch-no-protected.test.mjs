import { vi } from "vitest";

const mockLog = { info: vi.fn() };
const mockText = vi.fn();
const mockSpinner = { start: vi.fn(), stop: vi.fn() };
const mockExecute = vi.fn();
const mockInvoke = vi.fn();
const mockLlm = vi.fn(() => ({ invoke: mockInvoke }));
const mockGetBranchInstructionsFromJira = vi.fn();

vi.doMock("@clack/prompts", () => ({
  log: mockLog,
  text: mockText,
  spinner: () => mockSpinner,
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
}));

vi.doMock("./utils/execute.mjs", () => ({
  default: mockExecute,
}));

vi.doMock("./llm.mjs", () => ({
  default: mockLlm,
}));

vi.doMock("./config.mjs", () => ({
  default: {
    prompts: {
      createBranch: "test create branch prompt",
    },
  },
}));

vi.doMock("./integrations/jira.mjs", () => ({
  getBranchInstructionsFromJira: mockGetBranchInstructionsFromJira,
}));

const { default: branch } = await import("./branch.mjs");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("branch with no protectedBranches config", () => {
  it("should treat all branches as unprotected when protectedBranches is not configured", async () => {
    mockExecute.mockResolvedValueOnce("main\n");

    await branch(false);

    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining("not protected"));
    expect(mockLlm).not.toHaveBeenCalled();
  });
});

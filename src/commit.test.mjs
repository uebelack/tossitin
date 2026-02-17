import { jest } from "@jest/globals";

const mockLog = { info: jest.fn() };
const mockConfirm = jest.fn();
const mockExecute = jest.fn();
const mockInvoke = jest.fn();
const mockCreateAgent = jest.fn(() => ({ invoke: mockInvoke }));
const mockLlm = jest.fn(() => "mock-llm-instance");
const mockExecuteCommand = "mock-execute-command-tool";
const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});

jest.unstable_mockModule("@clack/prompts", () => ({
  log: mockLog,
  confirm: mockConfirm,
}));

jest.unstable_mockModule("./utils/execute.mjs", () => ({
  default: mockExecute,
}));

jest.unstable_mockModule("./llm.mjs", () => ({
  default: mockLlm,
}));

jest.unstable_mockModule("langchain", () => ({
  createAgent: mockCreateAgent,
}));

jest.unstable_mockModule("./tools/executeCommand.mjs", () => ({
  default: mockExecuteCommand,
}));

jest.unstable_mockModule("./config.mjs", () => ({
  default: {
    prompts: {
      commitPrompt: "test commit prompt",
    },
  },
}));

const { default: commit } = await import("./commit.mjs");

beforeEach(() => {
  jest.clearAllMocks();
  mockExit.mockImplementation(() => {});
});

afterAll(() => {
  mockExit.mockRestore();
});

describe("commit", () => {
  it("should exit when there are no files to commit", async () => {
    mockExecute.mockResolvedValueOnce("");

    await commit(false);

    expect(mockLog.info).toHaveBeenCalledWith(
      expect.stringContaining("No files to commit"),
    );
    expect(mockExit).toHaveBeenCalledWith(0);
    expect(mockCreateAgent).not.toHaveBeenCalled();
  });

  it("should exit when all files are untracked", async () => {
    mockExecute.mockResolvedValueOnce("?? newfile.txt\n?? another.txt");

    await commit(false);

    expect(mockExit).toHaveBeenCalledWith(0);
    expect(mockCreateAgent).not.toHaveBeenCalled();
  });

  it("should create agent with llm and executeCommand tool", async () => {
    mockExecute.mockResolvedValueOnce("M  src/index.mjs");
    mockInvoke.mockResolvedValueOnce({ content: "fix: update index" });
    mockConfirm.mockResolvedValueOnce(true);
    mockExecute.mockResolvedValueOnce("");

    await commit(false);

    expect(mockCreateAgent).toHaveBeenCalledWith({
      model: "mock-llm-instance",
      tools: [mockExecuteCommand],
    });
  });

  it("should invoke agent with commit prompt from config", async () => {
    mockExecute.mockResolvedValueOnce("M  src/index.mjs");
    mockInvoke.mockResolvedValueOnce({ content: "fix: update index" });
    mockConfirm.mockResolvedValueOnce(true);
    mockExecute.mockResolvedValueOnce("");

    await commit(false);

    expect(mockInvoke).toHaveBeenCalledWith({
      messages: [{ role: "user", content: "test commit prompt" }],
    });
  });

  it("should commit when user confirms", async () => {
    mockExecute.mockResolvedValueOnce("M  src/index.mjs");
    mockInvoke.mockResolvedValueOnce({ content: "feat: add new feature" });
    mockConfirm.mockResolvedValueOnce(true);
    mockExecute.mockResolvedValueOnce("");

    await commit(false);

    expect(mockExecute).toHaveBeenCalledWith(
      'git commit -m "feat: add new feature"',
    );
  });

  it("should commit without confirmation when force is true", async () => {
    mockExecute.mockResolvedValueOnce("M  src/index.mjs");
    mockInvoke.mockResolvedValueOnce({ content: "feat: forced commit" });
    mockExecute.mockResolvedValueOnce("");

    await commit(true);

    expect(mockConfirm).not.toHaveBeenCalled();
    expect(mockExecute).toHaveBeenCalledWith(
      'git commit -m "feat: forced commit"',
    );
  });

  it("should exit when user declines commit", async () => {
    mockExecute.mockResolvedValueOnce("M  src/index.mjs");
    mockInvoke.mockResolvedValueOnce({ content: "fix: some fix" });
    mockConfirm.mockResolvedValueOnce(false);

    await commit(false);

    expect(mockExit).toHaveBeenCalledWith(0);
    expect(mockExecute).not.toHaveBeenCalledWith(
      expect.stringContaining("git commit"),
    );
  });

  it("should log the commit message", async () => {
    mockExecute.mockResolvedValueOnce("M  src/index.mjs");
    mockInvoke.mockResolvedValueOnce({ content: "docs: update readme" });
    mockConfirm.mockResolvedValueOnce(true);
    mockExecute.mockResolvedValueOnce("");

    await commit(false);

    expect(mockLog.info).toHaveBeenCalledWith(
      expect.stringContaining("docs: update readme"),
    );
  });

  it("should filter out untracked files and parse filenames correctly", async () => {
    mockExecute.mockResolvedValueOnce(
      "M  modified.txt\n?? untracked.txt\nA  added.txt",
    );
    mockInvoke.mockResolvedValueOnce({ content: "chore: cleanup" });
    mockConfirm.mockResolvedValueOnce(true);
    mockExecute.mockResolvedValueOnce("");

    await commit(false);

    // Should proceed since there are tracked files (M and A)
    expect(mockCreateAgent).toHaveBeenCalled();
    expect(mockExecute).toHaveBeenCalledWith('git commit -m "chore: cleanup"');
  });

  it("should handle extractResult with messages format", async () => {
    mockExecute.mockResolvedValueOnce("M  file.txt");
    mockInvoke.mockResolvedValueOnce({
      messages: [
        { content: "thinking..." },
        { content: "fix: correct extraction" },
      ],
    });
    mockConfirm.mockResolvedValueOnce(true);
    mockExecute.mockResolvedValueOnce("");

    await commit(false);

    expect(mockExecute).toHaveBeenCalledWith(
      'git commit -m "fix: correct extraction"',
    );
  });
});

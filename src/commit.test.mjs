import { jest } from "@jest/globals";

const mockLog = { info: jest.fn() };
const mockConfirm = jest.fn();
const mockText = jest.fn();
const mockSpinner = { start: jest.fn(), stop: jest.fn() };
const mockIsCancel = jest.fn(() => false);
const mockCancel = jest.fn();
const mockExecute = jest.fn();
const mockAgentInvoke = jest.fn();
const mockCreateAgent = jest.fn(() => ({ invoke: mockAgentInvoke }));
const mockStructuredInvoke = jest.fn();
const mockWithStructuredOutput = jest.fn(() => ({
  invoke: mockStructuredInvoke,
}));
const mockLlmInstance = { withStructuredOutput: mockWithStructuredOutput };
const mockLlm = jest.fn(() => mockLlmInstance);
const mockExecuteCommand = "mock-execute-command-tool";
const mockExtractResult = jest.fn();
const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});

jest.unstable_mockModule("@clack/prompts", () => ({
  log: mockLog,
  confirm: mockConfirm,
  text: mockText,
  spinner: () => mockSpinner,
  isCancel: mockIsCancel,
  cancel: mockCancel,
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

const mockConfig = {
  prompts: {
    commitPrompt: "test commit prompt",
    extractCommitMessagePrompt: "test extract prompt",
  },
};

jest.unstable_mockModule("./config.mjs", () => ({
  default: mockConfig,
}));

jest.unstable_mockModule("./utils/extractResult.mjs", () => ({
  default: mockExtractResult,
}));

const { default: commit } = await import("./commit.mjs");

beforeEach(() => {
  jest.clearAllMocks();
  mockExit.mockImplementation(() => {});
  mockIsCancel.mockReturnValue(false);
  mockConfig.force = undefined;
});

afterAll(() => {
  mockExit.mockRestore();
});

describe("commit", () => {
  it("should exit when there are no files to commit", async () => {
    mockExecute.mockResolvedValueOnce("");

    await commit();

    expect(mockLog.info).toHaveBeenCalledWith(
      expect.stringContaining("No files to commit"),
    );
    expect(mockExit).toHaveBeenCalledWith(0);
    expect(mockCreateAgent).not.toHaveBeenCalled();
  });

  it("should exit when all files are untracked", async () => {
    mockExecute.mockResolvedValueOnce("?? newfile.txt\n?? another.txt");

    await commit();

    expect(mockExit).toHaveBeenCalledWith(0);
    expect(mockCreateAgent).not.toHaveBeenCalled();
  });

  it("should create agent with llm and executeCommand tool", async () => {
    mockExecute.mockResolvedValueOnce("M  src/index.mjs");
    mockAgentInvoke.mockResolvedValueOnce({ content: "raw agent output" });
    mockExtractResult.mockReturnValueOnce("raw agent output");
    mockStructuredInvoke.mockResolvedValueOnce({
      title: "fix: update index",
      description: "Updated index file",
    });
    mockText.mockResolvedValueOnce("fix: update index");
    mockConfirm.mockResolvedValueOnce(true);
    mockExecute.mockResolvedValueOnce("");

    await commit();

    expect(mockCreateAgent).toHaveBeenCalledWith({
      model: mockLlmInstance,
      tools: [mockExecuteCommand],
    });
  });

  it("should invoke agent with commit prompt from config", async () => {
    mockExecute.mockResolvedValueOnce("M  src/index.mjs");
    mockAgentInvoke.mockResolvedValueOnce({ content: "raw output" });
    mockExtractResult.mockReturnValueOnce("raw output");
    mockStructuredInvoke.mockResolvedValueOnce({
      title: "fix: update index",
      description: "desc",
    });
    mockText.mockResolvedValueOnce("fix: update index");
    mockConfirm.mockResolvedValueOnce(true);
    mockExecute.mockResolvedValueOnce("");

    await commit();

    expect(mockAgentInvoke).toHaveBeenCalledWith({
      messages: [{ role: "user", content: "test commit prompt" }],
    });
  });

  it("should commit with title only when user declines description", async () => {
    mockExecute.mockResolvedValueOnce("M  src/index.mjs");
    mockAgentInvoke.mockResolvedValueOnce({ content: "raw output" });
    mockExtractResult.mockReturnValueOnce("raw output");
    mockStructuredInvoke.mockResolvedValueOnce({
      title: "feat: add new feature",
      description: "Some description",
    });
    mockText.mockResolvedValueOnce("feat: add new feature");
    mockConfirm.mockResolvedValueOnce(false);
    mockExecute.mockResolvedValueOnce("");

    await commit();

    expect(mockExecute).toHaveBeenCalledWith(
      'git commit -m "feat: add new feature"',
    );
  });

  it("should commit with title and description when user confirms", async () => {
    mockExecute.mockResolvedValueOnce("M  src/index.mjs");
    mockAgentInvoke.mockResolvedValueOnce({ content: "raw output" });
    mockExtractResult.mockReturnValueOnce("raw output");
    mockStructuredInvoke.mockResolvedValueOnce({
      title: "feat: add new feature",
      description: "Added a great feature",
    });
    mockText.mockResolvedValueOnce("feat: add new feature");
    mockConfirm.mockResolvedValueOnce(true);
    mockExecute.mockResolvedValueOnce("");

    await commit();

    expect(mockExecute).toHaveBeenCalledWith(
      'git commit -m "feat: add new feature" -m "Added a great feature"',
    );
  });

  it("should commit without confirmation when force is true", async () => {
    mockConfig.force = true;
    mockExecute.mockResolvedValueOnce("M  src/index.mjs");
    mockAgentInvoke.mockResolvedValueOnce({ content: "raw output" });
    mockExtractResult.mockReturnValueOnce("raw output");
    mockStructuredInvoke.mockResolvedValueOnce({
      title: "feat: forced commit",
      description: "Forced description",
    });
    mockExecute.mockResolvedValueOnce("");

    await commit();

    expect(mockText).not.toHaveBeenCalled();
    expect(mockConfirm).not.toHaveBeenCalled();
    expect(mockExecute).toHaveBeenCalledWith(
      'git commit -m "feat: forced commit" -m "Forced description"',
    );
  });

  it("should exit when user cancels title input", async () => {
    mockExecute.mockResolvedValueOnce("M  src/index.mjs");
    mockAgentInvoke.mockResolvedValueOnce({ content: "raw output" });
    mockExtractResult.mockReturnValueOnce("raw output");
    mockStructuredInvoke.mockResolvedValueOnce({
      title: "fix: some fix",
      description: "desc",
    });
    mockText.mockResolvedValueOnce(Symbol("cancel"));
    mockIsCancel.mockReturnValueOnce(true);
    mockExit.mockImplementationOnce(() => {
      throw new Error("process.exit");
    });

    await expect(commit()).rejects.toThrow("process.exit");

    expect(mockCancel).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it("should exit when user cancels description confirmation", async () => {
    mockExecute.mockResolvedValueOnce("M  src/index.mjs");
    mockAgentInvoke.mockResolvedValueOnce({ content: "raw output" });
    mockExtractResult.mockReturnValueOnce("raw output");
    mockStructuredInvoke.mockResolvedValueOnce({
      title: "fix: some fix",
      description: "desc",
    });
    mockText.mockResolvedValueOnce("fix: some fix");
    mockConfirm.mockResolvedValueOnce(Symbol("cancel"));
    mockIsCancel.mockReturnValueOnce(false).mockReturnValueOnce(true);
    mockExit.mockImplementationOnce(() => {
      throw new Error("process.exit");
    });

    await expect(commit()).rejects.toThrow("process.exit");

    expect(mockCancel).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it("should log the commit message", async () => {
    mockExecute.mockResolvedValueOnce("M  src/index.mjs");
    mockAgentInvoke.mockResolvedValueOnce({ content: "raw output" });
    mockExtractResult.mockReturnValueOnce("raw output");
    mockStructuredInvoke.mockResolvedValueOnce({
      title: "docs: update readme",
      description: "Updated docs",
    });
    mockText.mockResolvedValueOnce("docs: update readme");
    mockConfirm.mockResolvedValueOnce(false);
    mockExecute.mockResolvedValueOnce("");

    await commit();

    expect(mockLog.info).toHaveBeenCalledWith(
      expect.stringContaining("Creating commit message"),
    );
  });

  it("should filter out untracked files and parse filenames correctly", async () => {
    mockExecute.mockResolvedValueOnce(
      "M  modified.txt\n?? untracked.txt\nA  added.txt",
    );
    mockAgentInvoke.mockResolvedValueOnce({ content: "raw output" });
    mockExtractResult.mockReturnValueOnce("raw output");
    mockStructuredInvoke.mockResolvedValueOnce({
      title: "chore: cleanup",
      description: "Cleaned up",
    });
    mockText.mockResolvedValueOnce("chore: cleanup");
    mockConfirm.mockResolvedValueOnce(true);
    mockExecute.mockResolvedValueOnce("");

    await commit();

    // Should proceed since there are tracked files (M and A)
    expect(mockCreateAgent).toHaveBeenCalled();
    expect(mockExecute).toHaveBeenCalledWith(
      'git commit -m "chore: cleanup" -m "Cleaned up"',
    );
  });

  it("should use extractResult to process agent output", async () => {
    mockExecute.mockResolvedValueOnce("M  file.txt");
    mockAgentInvoke.mockResolvedValueOnce({
      messages: [
        { content: "thinking..." },
        { content: "fix: correct extraction" },
      ],
    });
    mockExtractResult.mockReturnValueOnce("fix: correct extraction");
    mockStructuredInvoke.mockResolvedValueOnce({
      title: "fix: correct extraction",
      description: "Fixed extraction",
    });
    mockText.mockResolvedValueOnce("fix: correct extraction");
    mockConfirm.mockResolvedValueOnce(false);
    mockExecute.mockResolvedValueOnce("");

    await commit();

    expect(mockExtractResult).toHaveBeenCalled();
    expect(mockExecute).toHaveBeenCalledWith(
      'git commit -m "fix: correct extraction"',
    );
  });

  it("should escape special characters in commit messages", async () => {
    mockExecute.mockResolvedValueOnce("M  src/index.mjs");
    mockAgentInvoke.mockResolvedValueOnce({ content: "raw output" });
    mockExtractResult.mockReturnValueOnce("raw output");
    mockStructuredInvoke.mockResolvedValueOnce({
      title: 'fix: handle "quotes" properly',
      description: "Fixed $variable and `backtick` issues",
    });
    mockText.mockResolvedValueOnce('fix: handle "quotes" properly');
    mockConfirm.mockResolvedValueOnce(true);
    mockExecute.mockResolvedValueOnce("");

    await commit();

    expect(mockExecute).toHaveBeenCalledWith(
      'git commit -m "fix: handle \\"quotes\\" properly" -m "Fixed \\$variable and \\`backtick\\` issues"',
    );
  });

  it("should show spinner while extracting commit message", async () => {
    mockExecute.mockResolvedValueOnce("M  src/index.mjs");
    mockAgentInvoke.mockResolvedValueOnce({ content: "raw output" });
    mockExtractResult.mockReturnValueOnce("raw output");
    mockStructuredInvoke.mockResolvedValueOnce({
      title: "fix: test",
      description: "desc",
    });
    mockText.mockResolvedValueOnce("fix: test");
    mockConfirm.mockResolvedValueOnce(false);
    mockExecute.mockResolvedValueOnce("");

    await commit();

    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
  });
});

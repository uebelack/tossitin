import { vi } from "vitest";

const mockLog = { info: vi.fn() };
const mockText = vi.fn();
const mockSpinner = { start: vi.fn(), stop: vi.fn() };
const mockIsCancel = vi.fn(() => false);
const mockCancel = vi.fn();
const mockExecute = vi.fn();
const mockInvoke = vi.fn();
const mockLlm = vi.fn(() => ({ invoke: mockInvoke }));
const mockGetBranchInstructionsFromJira = vi.fn();
const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {});

vi.doMock("@clack/prompts", () => ({
  log: mockLog,
  text: mockText,
  spinner: () => mockSpinner,
  isCancel: mockIsCancel,
  cancel: mockCancel,
}));

vi.doMock("./utils/execute.mjs", () => ({
  default: mockExecute,
}));

vi.doMock("./llm.mjs", () => ({
  default: mockLlm,
}));

const mockConfig = {
  protectedBranches: ["main", "release/"],
  prompts: {
    createBranch: "test create branch prompt",
  },
};

vi.doMock("./config.mjs", () => ({
  default: mockConfig,
}));

vi.doMock("./integrations/jira.mjs", () => ({
  getBranchInstructionsFromJira: mockGetBranchInstructionsFromJira,
}));

const { default: branch } = await import("./branch.mjs");

beforeEach(() => {
  vi.clearAllMocks();
  mockConfig.force = undefined;
  mockIsCancel.mockReturnValue(false);
  mockExit.mockImplementation(() => {});
});

afterAll(() => {
  mockExit.mockRestore();
});

describe("branch", () => {
  it("should skip branch creation when current branch is not protected", async () => {
    mockExecute.mockResolvedValueOnce("feature/my-feature\n");

    await branch(false);

    expect(mockExecute).toHaveBeenCalledWith("git branch --show-current");
    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining("not protected"));
    expect(mockLlm).not.toHaveBeenCalled();
  });

  it("should create a new branch when on an exact-match protected branch", async () => {
    mockExecute.mockResolvedValueOnce("main\n");
    mockGetBranchInstructionsFromJira.mockResolvedValueOnce(null);
    mockText.mockResolvedValueOnce("add user login");
    mockInvoke.mockResolvedValueOnce({ content: "feature/add-user-login" });
    mockText.mockResolvedValueOnce("git checkout -b feature/add-user-login");
    mockExecute.mockResolvedValueOnce("");

    await branch(false);

    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining("protected"));
    expect(mockLlm).toHaveBeenCalled();
    expect(mockInvoke).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ content: "test create branch prompt" })]),
    );
    expect(mockText).toHaveBeenCalledWith(
      expect.objectContaining({
        initialValue: "git checkout -b feature/add-user-login",
      }),
    );
  });

  it("should create a new branch when on a prefix-match protected branch", async () => {
    mockExecute.mockResolvedValueOnce("release/v1.0\n");
    mockGetBranchInstructionsFromJira.mockResolvedValueOnce(null);
    mockText.mockResolvedValueOnce("hotfix for release");
    mockInvoke.mockResolvedValueOnce({ content: "hotfix/release-fix" });
    mockText.mockResolvedValueOnce("git checkout -b hotfix/release-fix");
    mockExecute.mockResolvedValueOnce("");

    await branch(false);

    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining("protected"));
    expect(mockLlm).toHaveBeenCalled();
  });

  it("should use Jira instructions when available", async () => {
    mockExecute.mockResolvedValueOnce("main\n");
    mockGetBranchInstructionsFromJira.mockResolvedValueOnce("PROJ-123 implement auth");
    mockInvoke.mockResolvedValueOnce({ content: "feature/PROJ-123-auth" });
    mockText.mockResolvedValueOnce("git checkout -b feature/PROJ-123-auth");
    mockExecute.mockResolvedValueOnce("");

    await branch(false);

    expect(mockText).not.toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("describe the branch"),
      }),
    );
    expect(mockInvoke).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          content: expect.stringContaining("PROJ-123 implement auth"),
        }),
      ]),
    );
  });

  it("should skip the branch check entirely when force is true", async () => {
    mockConfig.force = true;

    await branch();

    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining("skipping branch check"));
    expect(mockExecute).not.toHaveBeenCalled();
    expect(mockLlm).not.toHaveBeenCalled();
  });

  it("should exit when user cancels branch description input", async () => {
    mockExecute.mockResolvedValueOnce("main\n");
    mockGetBranchInstructionsFromJira.mockResolvedValueOnce(null);
    mockText.mockResolvedValueOnce(Symbol("cancel"));
    mockIsCancel.mockReturnValueOnce(true);
    mockExit.mockImplementationOnce(() => {
      throw new Error("process.exit");
    });

    await expect(branch()).rejects.toThrow("process.exit");

    expect(mockCancel).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it("should exit when user cancels branch command confirmation", async () => {
    mockExecute.mockResolvedValueOnce("main\n");
    mockGetBranchInstructionsFromJira.mockResolvedValueOnce(null);
    mockText.mockResolvedValueOnce("add feature");
    mockInvoke.mockResolvedValueOnce({ content: "feature/add-feature" });
    mockText.mockResolvedValueOnce(Symbol("cancel"));
    mockIsCancel.mockReturnValueOnce(false).mockReturnValueOnce(true);
    mockExit.mockImplementationOnce(() => {
      throw new Error("process.exit");
    });

    await expect(branch()).rejects.toThrow("process.exit");

    expect(mockCancel).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it("should show spinner while LLM is thinking", async () => {
    mockExecute.mockResolvedValueOnce("main\n");
    mockGetBranchInstructionsFromJira.mockResolvedValueOnce(null);
    mockText.mockResolvedValueOnce("new feature");
    mockInvoke.mockResolvedValueOnce({ content: "feature/new-feature" });
    mockExecute.mockResolvedValueOnce("");
    mockText.mockResolvedValueOnce("git checkout -b feature/new-feature");

    await branch(false);

    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalledWith(expect.stringContaining("feature/new-feature"));
  });
});

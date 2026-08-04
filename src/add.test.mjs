import { vi } from "vitest";

const mockLog = { info: vi.fn(), error: vi.fn() };
const mockSpinner = { start: vi.fn(), stop: vi.fn() };
const mockOutro = vi.fn();
const mockExecute = vi.fn();
const mockInvoke = vi.fn();
const mockWithStructuredOutput = vi.fn(() => ({ invoke: mockInvoke }));
const mockLlm = vi.fn(() => ({
  withStructuredOutput: mockWithStructuredOutput,
}));
const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {});

vi.doMock("@clack/prompts", () => ({
  log: mockLog,
  spinner: () => mockSpinner,
  outro: mockOutro,
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
      addPrompt: "test add prompt",
    },
  },
}));

const { default: add } = await import("./add.mjs");

beforeEach(() => {
  vi.clearAllMocks();
  mockExit.mockImplementation(() => {});
});

afterAll(() => {
  mockExit.mockRestore();
});

describe("add", () => {
  it("should run git add when there are no untracked files", async () => {
    mockExecute.mockResolvedValueOnce("M  src/index.mjs");
    mockExecute.mockResolvedValueOnce("");

    await add();

    expect(mockExecute).toHaveBeenCalledWith("git status -s");
    expect(mockExecute).toHaveBeenCalledWith("git add .");
    expect(mockLlm).not.toHaveBeenCalled();
  });

  it("should run git add when there are no files at all", async () => {
    mockExecute.mockResolvedValueOnce("");
    mockExecute.mockResolvedValueOnce("");

    await add();

    expect(mockExecute).toHaveBeenCalledWith("git status -s");
    expect(mockExecute).toHaveBeenCalledWith("git add .");
    expect(mockLlm).not.toHaveBeenCalled();
  });

  it("should check untracked files with LLM and add them if safe", async () => {
    mockExecute.mockResolvedValueOnce("?? newfile.txt\n?? another.txt");
    mockExecute.mockResolvedValueOnce("");
    mockInvoke.mockResolvedValueOnce({ dangerousFiles: [] });

    await add();

    expect(mockLlm).toHaveBeenCalled();
    expect(mockWithStructuredOutput).toHaveBeenCalled();
    expect(mockInvoke).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ content: "test add prompt" }),
        expect.objectContaining({ content: "newfile.txt\nanother.txt" }),
      ]),
    );
    expect(mockSpinner.start).toHaveBeenCalled();
    expect(mockSpinner.stop).toHaveBeenCalled();
    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining("newfile.txt"));
    expect(mockExecute).toHaveBeenCalledWith("git add .");
  });

  it("should exit when LLM detects dangerous files", async () => {
    mockExecute.mockResolvedValueOnce("?? .env");
    mockInvoke.mockResolvedValueOnce({
      dangerousFiles: [{ filename: ".env", reason: "Contains secrets" }],
    });

    await add();

    expect(mockLog.error).toHaveBeenCalledWith(expect.stringContaining(".env"));
    expect(mockLog.error).toHaveBeenCalledWith(expect.stringContaining("Contains secrets"));
    expect(mockOutro).toHaveBeenCalledWith(expect.stringContaining(".gitignore"));
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it("should only pick lines starting with ?? as untracked files", async () => {
    mockExecute.mockResolvedValueOnce("M  modified.txt\n?? untracked.txt\nA  added.txt");
    mockExecute.mockResolvedValueOnce("");
    mockInvoke.mockResolvedValueOnce({ dangerousFiles: [] });

    await add({});

    expect(mockInvoke).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ content: "untracked.txt" })]),
    );
  });
});

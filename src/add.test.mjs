import { jest } from "@jest/globals";

const mockLog = { info: jest.fn(), error: jest.fn() };
const mockSpinner = { start: jest.fn(), stop: jest.fn() };
const mockOutro = jest.fn();
const mockExecute = jest.fn();
const mockInvoke = jest.fn();
const mockWithStructuredOutput = jest.fn(() => ({ invoke: mockInvoke }));
const mockLlm = jest.fn(() => ({
  withStructuredOutput: mockWithStructuredOutput,
}));
const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});

jest.unstable_mockModule("@clack/prompts", () => ({
  log: mockLog,
  spinner: () => mockSpinner,
  outro: mockOutro,
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
      addPrompt: "test add prompt",
    },
  },
}));

const { default: add } = await import("./add.mjs");

beforeEach(() => {
  jest.clearAllMocks();
  mockExit.mockImplementation(() => {});
});

afterAll(() => {
  mockExit.mockRestore();
});

describe("add", () => {
  it("should run git add when there are no untracked files", async () => {
    mockExecute.mockResolvedValueOnce("M  src/index.mjs");
    mockExecute.mockResolvedValueOnce("");

    const state = { foo: "bar" };
    const result = await add(state);

    expect(mockExecute).toHaveBeenCalledWith("git status -s");
    expect(mockExecute).toHaveBeenCalledWith("git add .");
    expect(mockLlm).not.toHaveBeenCalled();
    expect(result).toBe(state);
  });

  it("should run git add when there are no files at all", async () => {
    mockExecute.mockResolvedValueOnce("");
    mockExecute.mockResolvedValueOnce("");

    const state = {};
    const result = await add(state);

    expect(mockExecute).toHaveBeenCalledWith("git status -s");
    expect(mockExecute).toHaveBeenCalledWith("git add .");
    expect(mockLlm).not.toHaveBeenCalled();
    expect(result).toBe(state);
  });

  it("should check untracked files with LLM and add them if safe", async () => {
    mockExecute.mockResolvedValueOnce("?? newfile.txt\n?? another.txt");
    mockExecute.mockResolvedValueOnce("");
    mockInvoke.mockResolvedValueOnce({ dangerousFiles: [] });

    const state = { key: "value" };
    const result = await add(state);

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
    expect(mockLog.info).toHaveBeenCalledWith(
      expect.stringContaining("newfile.txt"),
    );
    expect(mockExecute).toHaveBeenCalledWith("git add .");
    expect(result).toBe(state);
  });

  it("should exit when LLM detects dangerous files", async () => {
    mockExecute.mockResolvedValueOnce("?? .env");
    mockInvoke.mockResolvedValueOnce({
      dangerousFiles: [{ filename: ".env", reason: "Contains secrets" }],
    });

    const state = {};
    await add(state);

    expect(mockLog.error).toHaveBeenCalledWith(expect.stringContaining(".env"));
    expect(mockLog.error).toHaveBeenCalledWith(
      expect.stringContaining("Contains secrets"),
    );
    expect(mockOutro).toHaveBeenCalledWith(
      expect.stringContaining(".gitignore"),
    );
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it("should only pick lines starting with ?? as untracked files", async () => {
    mockExecute.mockResolvedValueOnce(
      "M  modified.txt\n?? untracked.txt\nA  added.txt",
    );
    mockExecute.mockResolvedValueOnce("");
    mockInvoke.mockResolvedValueOnce({ dangerousFiles: [] });

    await add({});

    expect(mockInvoke).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ content: "untracked.txt" }),
      ]),
    );
  });
});

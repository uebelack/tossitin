import { jest } from "@jest/globals";

const mockLog = { info: jest.fn(), error: jest.fn() };
const mockExecaCommand = jest.fn();
const mockTool = jest.fn((fn, config) => {
  const wrapper = (input) => fn(input);
  Object.defineProperty(wrapper, "name", { value: config.name });
  wrapper.description = config.description;
  wrapper.schema = config.schema;
  return wrapper;
});

jest.unstable_mockModule("@langchain/core/tools", () => ({
  tool: mockTool,
}));

jest.unstable_mockModule("execa", () => ({
  execaCommand: mockExecaCommand,
}));

jest.unstable_mockModule("@clack/prompts", () => ({
  log: mockLog,
}));

const { default: executeCommand } = await import("./executeCommand.mjs");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("executeCommand", () => {
  it("should be registered as a tool with correct metadata", () => {
    expect(executeCommand.name).toBe("execute");
    expect(executeCommand.description).toBe("Execute a command line command");
    expect(executeCommand.schema).toEqual({
      type: "object",
      properties: {
        command: { type: "string", description: "Command to execute" },
      },
      required: ["command"],
      additionalProperties: false,
    });
  });

  it("should execute command and return output", async () => {
    mockExecaCommand.mockResolvedValueOnce({ all: "command output" });

    const result = await executeCommand({ command: "git status" });

    expect(mockExecaCommand).toHaveBeenCalledWith("git status", {
      shell: true,
      all: true,
    });
    expect(result).toBe("command output");
  });

  it("should log the command being executed", async () => {
    mockExecaCommand.mockResolvedValueOnce({ all: "" });

    await executeCommand({ command: "git diff --stat" });

    expect(mockLog.info).toHaveBeenCalledWith(
      expect.stringContaining("git diff --stat"),
    );
  });

  it("should return error message when command fails with stderr", async () => {
    mockExecaCommand.mockRejectedValueOnce({
      exitCode: 128,
      stderr: "fatal: not a git repository",
      message: "Command failed",
    });

    const result = await executeCommand({ command: "git log" });

    expect(result).toContain("Command failed with exit code 128");
    expect(result).toContain("fatal: not a git repository");
  });

  it("should fall back to error.message when stderr is empty", async () => {
    mockExecaCommand.mockRejectedValueOnce({
      exitCode: 1,
      stderr: "",
      message: "Something went wrong",
    });

    const result = await executeCommand({ command: "bad command" });

    expect(result).toContain("Something went wrong");
  });

  it("should include tip about git options in error message", async () => {
    mockExecaCommand.mockRejectedValueOnce({
      exitCode: 1,
      stderr: "error",
      message: "failed",
    });

    const result = await executeCommand({
      command: "git diff index.mjs --stat",
    });

    expect(result).toContain("Tip:");
    expect(result).toContain("--stat");
  });

  it("should log error when command fails", async () => {
    mockExecaCommand.mockRejectedValueOnce({
      exitCode: 1,
      stderr: "error",
      message: "failed",
    });

    await executeCommand({ command: "failing command" });

    expect(mockLog.error).toHaveBeenCalledWith(
      expect.stringContaining("failing command"),
    );
  });

  it("should return empty string when command produces no output", async () => {
    mockExecaCommand.mockResolvedValueOnce({ all: "" });

    const result = await executeCommand({ command: "git add ." });

    expect(result).toBe("");
  });
});

import { jest } from "@jest/globals";

const mockExecaCommand = jest.fn();

jest.unstable_mockModule("execa", () => ({
  execaCommand: mockExecaCommand,
}));

const { default: execute } = await import("./execute.mjs");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("execute", () => {
  it("should call execaCommand with shell and all options", async () => {
    mockExecaCommand.mockResolvedValueOnce({ all: "output" });

    await execute("git status");

    expect(mockExecaCommand).toHaveBeenCalledWith("git status", {
      shell: true,
      all: true,
    });
  });

  it("should return the all property from the result", async () => {
    mockExecaCommand.mockResolvedValueOnce({ all: "combined output" });

    const result = await execute("echo hello");

    expect(result).toBe("combined output");
  });

  it("should return empty string when command produces no output", async () => {
    mockExecaCommand.mockResolvedValueOnce({ all: "" });

    const result = await execute("git add .");

    expect(result).toBe("");
  });

  it("should propagate errors from execaCommand", async () => {
    mockExecaCommand.mockRejectedValueOnce(new Error("command failed"));

    await expect(execute("bad command")).rejects.toThrow("command failed");
  });
});

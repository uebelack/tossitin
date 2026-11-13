import { vi } from "vitest";

const mockExeca = vi.fn();

vi.doMock("execa", () => ({
  execa: mockExeca,
}));

const { default: execute } = await import("./execute.mjs");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("execute", () => {
  it("should call execa with shell and all options", async () => {
    mockExeca.mockResolvedValueOnce({ all: "output" });

    await execute("git status");

    expect(mockExeca).toHaveBeenCalledWith("git status", {
      shell: true,
      all: true,
    });
  });

  it("should return the all property from the result", async () => {
    mockExeca.mockResolvedValueOnce({ all: "combined output" });

    const result = await execute("echo hello");

    expect(result).toBe("combined output");
  });

  it("should return empty string when command produces no output", async () => {
    mockExeca.mockResolvedValueOnce({ all: "" });

    const result = await execute("git add .");

    expect(result).toBe("");
  });

  it("should propagate errors from execa", async () => {
    mockExeca.mockRejectedValueOnce(new Error("command failed"));

    await expect(execute("bad command")).rejects.toThrow("command failed");
  });
});

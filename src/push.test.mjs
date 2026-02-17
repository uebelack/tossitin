import { jest } from "@jest/globals";

const mockLog = { info: jest.fn() };
const mockExecute = jest.fn();

jest.unstable_mockModule("@clack/prompts", () => ({
  log: mockLog,
}));

jest.unstable_mockModule("./utils/execute.mjs", () => ({
  default: mockExecute,
}));

const { default: push } = await import("./push.mjs");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("push", () => {
  it("should push to remote successfully", async () => {
    mockExecute.mockResolvedValueOnce("");

    await push();

    expect(mockExecute).toHaveBeenCalledWith("git push");
    expect(mockLog.info).toHaveBeenCalledWith(
      expect.stringContaining("Pushing to remote"),
    );
    expect(mockLog.info).toHaveBeenCalledWith(
      expect.stringContaining("Pushed to remote"),
    );
  });

  it("should set upstream and push when git push fails", async () => {
    mockExecute.mockRejectedValueOnce(new Error("no upstream"));
    mockExecute.mockResolvedValueOnce("feature/my-branch\n");
    mockExecute.mockResolvedValueOnce("");

    await push();

    expect(mockExecute).toHaveBeenCalledWith("git push");
    expect(mockExecute).toHaveBeenCalledWith(
      "git rev-parse --abbrev-ref HEAD",
    );
    expect(mockExecute).toHaveBeenCalledWith(
      "git push --set-upstream origin feature/my-branch",
    );
  });

  it("should log upstream message when setting upstream", async () => {
    mockExecute.mockRejectedValueOnce(new Error("no upstream"));
    mockExecute.mockResolvedValueOnce("develop\n");
    mockExecute.mockResolvedValueOnce("");

    await push();

    expect(mockLog.info).toHaveBeenCalledWith(
      expect.stringContaining("No upstream branch"),
    );
    expect(mockLog.info).toHaveBeenCalledWith(
      expect.stringContaining("origin/develop"),
    );
  });

  it("should log pushed message after setting upstream", async () => {
    mockExecute.mockRejectedValueOnce(new Error("no upstream"));
    mockExecute.mockResolvedValueOnce("main\n");
    mockExecute.mockResolvedValueOnce("");

    await push();

    expect(mockLog.info).toHaveBeenLastCalledWith(
      expect.stringContaining("Pushed to remote"),
    );
  });

  it("should propagate error if set-upstream push also fails", async () => {
    mockExecute.mockRejectedValueOnce(new Error("no upstream"));
    mockExecute.mockResolvedValueOnce("feature/test\n");
    mockExecute.mockRejectedValueOnce(new Error("permission denied"));

    await expect(push()).rejects.toThrow("permission denied");
  });
});

import { jest } from "@jest/globals";

const mockIntro = jest.fn();
const mockOutro = jest.fn();
const mockBranch = jest.fn();
const mockAdd = jest.fn();
const mockCommit = jest.fn();
const mockPush = jest.fn();

jest.unstable_mockModule("@clack/prompts", () => ({
  intro: mockIntro,
  outro: mockOutro,
}));

jest.unstable_mockModule("./src/branch.mjs", () => ({
  default: mockBranch,
}));

jest.unstable_mockModule("./src/add.mjs", () => ({
  default: mockAdd,
}));

jest.unstable_mockModule("./src/commit.mjs", () => ({
  default: mockCommit,
}));

jest.unstable_mockModule("./src/push.mjs", () => ({
  default: mockPush,
}));

jest.unstable_mockModule("./src/config.mjs", () => ({
  default: {
    force: false,
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("index", () => {
  it("should run the full workflow", async () => {
    mockBranch.mockResolvedValueOnce();
    mockAdd.mockResolvedValueOnce();
    mockCommit.mockResolvedValueOnce();
    mockPush.mockResolvedValueOnce();

    await import("./index.mjs");

    expect(mockIntro).toHaveBeenCalledWith(expect.stringContaining("ToSS IT"));
    expect(mockBranch).toHaveBeenCalledWith(false);
    expect(mockAdd).toHaveBeenCalledWith(false);
    expect(mockCommit).toHaveBeenCalledWith(false);
    expect(mockPush).toHaveBeenCalled();
    expect(mockOutro).toHaveBeenCalledWith(
      expect.stringContaining("committed and pushed"),
    );
  });
});

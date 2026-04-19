import { jest } from "@jest/globals";

const mockSelect = jest.fn();
const mockIsCancel = jest.fn(() => false);
const mockCancel = jest.fn();
const mockFetch = jest.fn();
global.fetch = mockFetch;
const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});

jest.unstable_mockModule("@clack/prompts", () => ({
  select: mockSelect,
  isCancel: mockIsCancel,
  cancel: mockCancel,
}));

const mockConfig = {
  jira: {
    url: "https://jira.example.com",
    pat: "test-token",
    jql: "assignee = currentUser() AND status = 'In Progress'",
  },
};

jest.unstable_mockModule("../config.mjs", () => ({
  default: mockConfig,
}));

const { getBranchInstructionsFromJira } = await import("./jira.mjs");

beforeEach(() => {
  jest.clearAllMocks();
  mockIsCancel.mockReturnValue(false);
  mockExit.mockImplementation(() => {});
  mockConfig.jira = {
    url: "https://jira.example.com",
    pat: "test-token",
    jql: "assignee = currentUser() AND status = 'In Progress'",
  };
});

afterAll(() => {
  mockExit.mockRestore();
});

describe("getBranchInstructionsFromJira", () => {
  it("should return undefined when jira config is not set", async () => {
    delete mockConfig.jira;

    const result = await getBranchInstructionsFromJira();

    expect(result).toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return null when there are no issues", async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ issues: [] }),
    });

    const result = await getBranchInstructionsFromJira();

    expect(result).toBeNull();
  });

  it("should return instructions for a single issue without prompting", async () => {
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          issues: [
            {
              key: "PROJ-123",
              fields: {
                issuetype: { name: "Story" },
                summary: "Implement login page",
              },
            },
          ],
        }),
    });

    const result = await getBranchInstructionsFromJira();

    expect(result).toBe(
      "Key: PROJ-123\nType: Story\nSummary: Implement login page",
    );
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("should prompt user to select when multiple issues exist", async () => {
    const issues = [
      {
        key: "PROJ-1",
        fields: {
          issuetype: { name: "Bug" },
          summary: "Fix login",
        },
      },
      {
        key: "PROJ-2",
        fields: {
          issuetype: { name: "Story" },
          summary: "Add signup",
        },
      },
    ];

    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ issues }),
    });

    mockSelect.mockResolvedValueOnce({
      key: "PROJ-2",
      type: "Story",
      summary: "Add signup",
    });

    const result = await getBranchInstructionsFromJira();

    expect(mockSelect).toHaveBeenCalledWith({
      message: "Select the Jira issue you want to work on:",
      options: [
        {
          value: { key: "PROJ-1", type: "Bug", summary: "Fix login" },
          label: "PROJ-1: Fix login",
        },
        {
          value: { key: "PROJ-2", type: "Story", summary: "Add signup" },
          label: "PROJ-2: Add signup",
        },
      ],
    });
    expect(result).toBe("Key: PROJ-2\nType: Story\nSummary: Add signup");
  });

  it("should call fetch with correct URL and auth header", async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ issues: [] }),
    });

    await getBranchInstructionsFromJira();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "https://jira.example.com/rest/api/2/search?jql=",
      ),
      {
        method: "GET",
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        },
      },
    );
  });

  it("should encode JQL in the URL", async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ issues: [] }),
    });

    await getBranchInstructionsFromJira();

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain(
      encodeURI("assignee = currentUser() AND status = 'In Progress'"),
    );
  });

  it("should exit when user cancels issue selection", async () => {
    const issues = [
      {
        key: "PROJ-1",
        fields: {
          issuetype: { name: "Bug" },
          summary: "Fix login",
        },
      },
      {
        key: "PROJ-2",
        fields: {
          issuetype: { name: "Story" },
          summary: "Add signup",
        },
      },
    ];

    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ issues }),
    });

    mockSelect.mockResolvedValueOnce(Symbol("cancel"));
    mockIsCancel.mockReturnValueOnce(true);
    mockExit.mockImplementationOnce(() => {
      throw new Error("process.exit");
    });

    await expect(getBranchInstructionsFromJira()).rejects.toThrow(
      "process.exit",
    );

    expect(mockCancel).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it("should strip trailing slash from jira URL", async () => {
    mockConfig.jira.url = "https://jira.example.com/";
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ issues: [] }),
    });

    await getBranchInstructionsFromJira();

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toMatch(
      /^https:\/\/jira\.example\.com\/rest\/api\/2\/search/,
    );
    expect(calledUrl).not.toContain("//rest");
  });
});

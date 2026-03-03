const { default: extractResult } = await import("./extractResult.mjs");

describe("extractResult", () => {
  it("should return the result directly when it has no content or messages", () => {
    const result = "plain string";

    expect(extractResult(result)).toBe("plain string");
  });

  it("should extract content from result with content property", () => {
    const result = { content: "the content" };

    expect(extractResult(result)).toBe("the content");
  });

  it("should extract last message content from result with messages", () => {
    const result = {
      messages: [
        { content: "first message" },
        { content: "second message" },
        { content: "last message" },
      ],
    };

    expect(extractResult(result)).toBe("last message");
  });

  it("should prefer messages over content when both are present", () => {
    const result = {
      content: "the content",
      messages: [{ content: "from messages" }],
    };

    expect(extractResult(result)).toBe("from messages");
  });

  it("should strip think tags and return text after them", () => {
    const result = {
      content: "<think>some reasoning</think>the actual result",
    };

    expect(extractResult(result)).toBe("the actual result");
  });

  it("should trim whitespace after think tags", () => {
    const result = {
      content: "<think>reasoning</think>   trimmed result   ",
    };

    expect(extractResult(result)).toBe("trimmed result");
  });

  it("should handle think tags in messages format", () => {
    const result = {
      messages: [
        { content: "earlier" },
        { content: "<think>reasoning</think>final answer" },
      ],
    };

    expect(extractResult(result)).toBe("final answer");
  });

  it("should return content as-is when no think tags are present", () => {
    const result = { content: "no thinking here" };

    expect(extractResult(result)).toBe("no thinking here");
  });

  it("should handle single message in messages array", () => {
    const result = {
      messages: [{ content: "only message" }],
    };

    expect(extractResult(result)).toBe("only message");
  });
});

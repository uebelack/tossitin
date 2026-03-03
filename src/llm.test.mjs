import { jest } from "@jest/globals";

const mockOutro = jest.fn();
const mockChatAnthropic = jest.fn();
const mockChatOllama = jest.fn();
const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});

jest.unstable_mockModule("@clack/prompts", () => ({
  outro: mockOutro,
}));

jest.unstable_mockModule("@langchain/anthropic", () => ({
  ChatAnthropic: mockChatAnthropic,
}));

jest.unstable_mockModule("@langchain/ollama", () => ({
  ChatOllama: mockChatOllama,
}));

jest.unstable_mockModule("./utils/env.mjs", () => ({
  default: (key, defaultValue) => process.env[key] || defaultValue,
}));

const { default: llm } = await import("./llm.mjs");

const originalEnv = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...originalEnv };
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OLLAMA_MODEL;
  delete process.env.ANTHROPIC_MODEL;
  mockExit.mockImplementation(() => {});
});

afterAll(() => {
  process.env = originalEnv;
  mockExit.mockRestore();
});

describe("llm", () => {
  it("should return ChatAnthropic when ANTHROPIC_API_KEY is set", () => {
    process.env.ANTHROPIC_API_KEY = "test-key";

    llm();

    expect(mockChatAnthropic).toHaveBeenCalledWith({
      model: "claude-sonnet-4-5",
    });
  });

  it("should use custom ANTHROPIC_MODEL when set", () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    process.env.ANTHROPIC_MODEL = "claude-opus-4";

    llm();

    expect(mockChatAnthropic).toHaveBeenCalledWith({
      model: "claude-opus-4",
    });
  });

  it("should return ChatOllama when OLLAMA_MODEL is set", () => {
    process.env.OLLAMA_MODEL = "llama3";

    llm();

    expect(mockChatOllama).toHaveBeenCalledWith({
      model: "llama3",
    });
  });

  it("should prefer Anthropic over Ollama when both are set", () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    process.env.OLLAMA_MODEL = "llama3";

    llm();

    expect(mockChatAnthropic).toHaveBeenCalled();
    expect(mockChatOllama).not.toHaveBeenCalled();
  });

  it("should exit with error when no LLM config is set", () => {
    llm();

    expect(mockOutro).toHaveBeenCalledWith(
      expect.stringContaining("could not find a valid LLM configuration"),
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

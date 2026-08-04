import { vi } from "vitest";

const mockOutro = vi.fn();
const mockChatAnthropic = vi.fn();
const mockChatOllama = vi.fn();
const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {});

vi.doMock("@clack/prompts", () => ({
  outro: mockOutro,
}));

vi.doMock("@langchain/anthropic", () => ({
  ChatAnthropic: mockChatAnthropic,
}));

vi.doMock("@langchain/ollama", () => ({
  ChatOllama: mockChatOllama,
}));

vi.doMock("./utils/env.mjs", () => ({
  default: (key, defaultValue) => process.env[key] || defaultValue,
}));

const { default: llm } = await import("./llm.mjs");

const originalEnv = process.env;

beforeEach(() => {
  vi.clearAllMocks();
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

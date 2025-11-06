import { outro } from "@clack/prompts";
import { Ollama } from "@langchain/ollama";
import { ChatAnthropic } from "@langchain/anthropic";
import env from "./utils/env.mjs";

function llm() {
  if (process.env.ANTHROPIC_API_KEY) {
    return new ChatAnthropic({
      model: env("ANTHROPIC_MODEL", "claude-sonnet-4-5"),
    });
  }

  if (process.env.OLLAMA_MODEL) {
    return new Ollama({
      model: env("OLLAMA_MODEL"),
    });
  }

  outro(
    "❌ could not find a valid LLM configuration. Please set ANTHROPIC_API_KEY or OLLAMA_MODEL environment variable and try again.",
  );

  process.exit(1);
}

export default llm;

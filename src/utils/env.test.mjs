import { jest } from "@jest/globals";

const { default: env } = await import("./env.mjs");

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

describe("env", () => {
  it("should return the value of an existing env variable", () => {
    process.env.TEST_KEY = "test_value";

    expect(env("TEST_KEY")).toBe("test_value");
  });

  it("should return undefined when variable is not set and no default", () => {
    delete process.env.MISSING_KEY;

    expect(env("MISSING_KEY")).toBeUndefined();
  });

  it("should return default value when variable is not set", () => {
    delete process.env.MISSING_KEY;

    expect(env("MISSING_KEY", "fallback")).toBe("fallback");
  });

  it("should return env value over default when variable is set", () => {
    process.env.MY_VAR = "real_value";

    expect(env("MY_VAR", "fallback")).toBe("real_value");
  });

  it("should return default value when variable is empty string", () => {
    process.env.EMPTY_VAR = "";

    expect(env("EMPTY_VAR", "fallback")).toBe("fallback");
  });
});

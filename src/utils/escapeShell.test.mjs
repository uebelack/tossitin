import escapeShell from "./escapeShell.mjs";

describe("escapeShell", () => {
  it("should escape double quotes", () => {
    expect(escapeShell('hello "world"')).toBe('hello \\"world\\"');
  });

  it("should escape backslashes", () => {
    expect(escapeShell("hello\\world")).toBe("hello\\\\world");
  });

  it("should escape dollar signs", () => {
    expect(escapeShell("hello $world")).toBe("hello \\$world");
  });

  it("should escape backticks", () => {
    expect(escapeShell("hello `world`")).toBe("hello \\`world\\`");
  });

  it("should escape multiple special characters", () => {
    expect(escapeShell('say "hello" to $user `now`')).toBe(
      'say \\"hello\\" to \\$user \\`now\\`',
    );
  });

  it("should return the string unchanged when no special characters", () => {
    expect(escapeShell("hello world")).toBe("hello world");
  });
});

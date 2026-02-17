describe("prompts", () => {
  it("should export addPrompt as a non-empty string", async () => {
    const { default: addPrompt } = await import("./addPrompt.mjs");

    expect(typeof addPrompt).toBe("string");
    expect(addPrompt.length).toBeGreaterThan(0);
  });

  it("should export commitPrompt as a non-empty string", async () => {
    const { default: commitPrompt } = await import("./commitPrompt.mjs");

    expect(typeof commitPrompt).toBe("string");
    expect(commitPrompt.length).toBeGreaterThan(0);
  });

  it("should export createBranchPrompt as a non-empty string", async () => {
    const { default: createBranchPrompt } = await import(
      "./createBranchPrompt.mjs"
    );

    expect(typeof createBranchPrompt).toBe("string");
    expect(createBranchPrompt.length).toBeGreaterThan(0);
  });
});

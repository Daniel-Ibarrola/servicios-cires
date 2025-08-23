import { describe, expect, it } from "vitest";
import { createTestEml } from "../utils/create-test-eml";

import { removeEmailHeaders, replaceTo } from "../../src/email";

describe("removeEmailHeaders", () => {
  it("Should remove the From header line if it exists", () => {
    const email = createTestEml(
      "daniel@example.com",
      "yourmother@example.com",
      "123345",
    );
    const formatted = removeEmailHeaders(email);
    expect(formatted).not.toContain("From: daniel@example.com");
  });

  it("Should remove the BCC line if it exists", () => {
    const email = createTestEml(
      "daniel@example.com",
      "yourmother@example.com",
      "123345",
      "triton@example.com, sanson@example.com",
    );
    const formatted = removeEmailHeaders(email);
    expect(formatted).not.toContain(
      "BCC: triton@example.com, sanson@example.com",
    );
  });
});

describe("replaceTo", () => {
  it("Should replace to with new value", () => {
    const email = createTestEml(
      "daniel@example.com",
      "yourmother@example.com",
      "123345",
    );
    const formatted = replaceTo(email, "triton@example.com");
    expect(formatted).not.toContain("To: yourmother@example.com");
    expect(formatted).toContain("To: triton@example.com");
  });
});

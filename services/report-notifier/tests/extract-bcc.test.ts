import { describe, expect, it } from "vitest";
import { createTestEml } from "./utils";
import { extractBCC } from "../src";

describe("extractBcc", () => {
  it("Returns an array with the bcc emails", () => {
    const email = createTestEml(
      "daniel@example.com",
      "yourmother@example.com",
      "123345",
      "triton@example.com, sanson@example.com",
    );
    const recipients = extractBCC(email);
    expect(recipients).toEqual(["triton@example.com", "sanson@example.com"]);
  });

  it("Returns an empty array if no bcc emails are found", () => {
    const email = createTestEml(
      "daniel@example.com",
      "yourmother@example.com",
      "123345",
    );
    const recipients = extractBCC(email);
    expect(recipients).toHaveLength(0);
  });
});

import { describe, expect, it } from "vitest";
import { createTestEml } from "../utils/create-test-eml";
import { extractBCC } from "../../src";

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

  it("works with multiple emails", () => {
    const emails: string[] = [];
    for (let i = 1; i <= 15; i++) {
      emails.push(`test.user${i}@example.com`);
    }

    const email = createTestEml(
      "daniel@example.com",
      "yourmother@example.com",
      "123345",
      emails.join(", "),
    );
    const recipients = extractBCC(email);
    expect(recipients).toHaveLength(emails.length);
    expect(recipients).toEqual(emails);
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

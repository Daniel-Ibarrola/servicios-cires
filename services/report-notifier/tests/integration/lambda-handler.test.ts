import { describe, expect, it } from "vitest";
import { handler } from "../../src";
import { createS3Event } from "../utils/s3-event";

/**
 * @group Integration Tests - Lambda Handler
 * @description
 * These tests invoke the Lambda handler function directly to simulate an S3 trigger.
 *
 * PLEASE BE AWARE:
 * - These tests perform REAL calls to AWS services (S3 and SES).
 * - They require the AWS credentials to be configured in the environment.
 * - For the tests to succeed, the specified .eml files (e.g., "test_multiple_recipients.eml")
 *   must already exist in the S3 bucket that the Lambda function reads from.
 */

describe("Lambda Handler", () => {
  it("Should return 200 status code when email is valid", async () => {
    // The object should exist in S3 for this to work
    const s3Event = createS3Event("test_multiple_recipients.eml");
    const response = await handler(s3Event);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toContain("Sent 7 out of 7 email(s) successfully");
  });
});

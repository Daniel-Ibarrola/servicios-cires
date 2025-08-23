import { describe, expect, it } from "vitest";
import { handler } from "../../src";
import { createS3Event } from "../utils/s3-event";
import { v4 as uuidv4 } from "uuid";

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
  it("Should process the file and send the emails only once", async () => {
    const s3Event = createS3Event("test-no-attachments.eml", uuidv4());
    const response = await handler(s3Event);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toContain("Sent 1 out of 1 email(s) successfully");

    // Using the same S3 event should not sent the email again
    const response2 = await handler(s3Event);
    expect(response2.statusCode).toEqual(200);
    expect(response2.body).toContain("Event already processed");
  });
});

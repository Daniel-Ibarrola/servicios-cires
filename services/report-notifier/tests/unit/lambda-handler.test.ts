import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from "vitest";
import { Readable } from "stream";
import { S3Client } from "@aws-sdk/client-s3";
import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { handler } from "../../src";
import { createS3Event } from "../utils/s3-event";
import { createTestEml } from "../utils/create-test-eml";

let s3SendSpy: MockInstance;
let sesSendSpy: MockInstance;
let dynamoDBSpy: MockInstance;

describe("Lambda Handler - Unit Tests", () => {
  const originalSenderEnv = process.env.VERIFIED_SENDER;

  beforeEach(() => {
    s3SendSpy = vi.spyOn(S3Client.prototype, "send");
    sesSendSpy = vi.spyOn(SESClient.prototype, "send");
    dynamoDBSpy = vi.spyOn(DynamoDBClient.prototype, "send");
    process.env.VERIFIED_SENDER = "sender@test.com";
    process.env.EVENT_TRACKER_TABLE_NAME = "report-notifier-events-test";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.VERIFIED_SENDER = originalSenderEnv;
  });

  const mockS3GetObject = (emlContent: string) => {
    const stream = new Readable();
    stream.push(emlContent);
    stream.push(null); // End of stream
    s3SendSpy.mockResolvedValue({ Body: stream });
  };

  it("Should throw an error if VERIFIED_SENDER is not set", async () => {
    delete process.env.VERIFIED_SENDER;
    const s3Event = createS3Event("test.eml");
    await expect(handler(s3Event)).rejects.toThrow(
      "VERIFIED_SENDER environment variable is not set",
    );
  });

  it("Should throw an error if EVENT_TRACKER_TABLE_NAME is not set", async () => {
    delete process.env.EVENT_TRACKER_TABLE_NAME;
    const s3Event = createS3Event("test.eml");
    await expect(handler(s3Event)).rejects.toThrow(
      "EVENT_TRACKER_TABLE_NAME environment variable is not set",
    );
  });

  it("Should return 200 and send one email for a valid file with no BCC", async () => {
    const emlContent = createTestEml("from@test.com", "to@test.com", "no-bcc");
    mockS3GetObject(emlContent);
    sesSendSpy.mockResolvedValue({ MessageId: "fake-id" });
    dynamoDBSpy.mockResolvedValue(undefined);
    const s3Event = createS3Event("test.eml");

    const response = await handler(s3Event);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toContain("Sent 1 out of 1 email(s) successfully");
    expect(s3SendSpy).toHaveBeenCalledTimes(1);
    expect(sesSendSpy).toHaveBeenCalledTimes(1);
  });

  it("Should send multiple emails when BCC is present", async () => {
    const bccAddresses = "bcc1@example.com,bcc2@example.com";
    const bccCount = bccAddresses.split(",").length;
    const emlContent = createTestEml(
      "from@test.com",
      "to@test.com",
      "with-bcc",
      bccAddresses,
    );
    mockS3GetObject(emlContent);
    sesSendSpy.mockResolvedValue({ MessageId: "fake-id" });
    dynamoDBSpy.mockResolvedValue(undefined);
    const s3Event = createS3Event("test.eml");

    const response = await handler(s3Event);

    const totalEmails = 1 + bccCount;
    expect(response.statusCode).toEqual(200);
    expect(response.body).toContain(
      `Sent ${totalEmails} out of ${totalEmails} email(s) successfully`,
    );
    expect(sesSendSpy).toHaveBeenCalledTimes(totalEmails);
  });

  it("Should work for multiple BCC addresses", async () => {
    const emails: string[] = [];
    for (let i = 1; i <= 20; i++) {
      emails.push(`test.user${i}@example.com`);
    }

    const emlContent = createTestEml(
      "from@test.com",
      "to@test.com",
      "with-bcc",
      emails.join(", "),
    );
    mockS3GetObject(emlContent);
    sesSendSpy.mockResolvedValue({ MessageId: "fake-id" });
    dynamoDBSpy.mockResolvedValue(undefined);
    const s3Event = createS3Event("test.eml");

    const response = await handler(s3Event);

    const totalEmails = 1 + emails.length;
    expect(response.statusCode).toEqual(200);
    expect(response.body).toContain(
      `Sent ${totalEmails} out of ${totalEmails} email(s) successfully`,
    );

    expect(sesSendSpy).toHaveBeenCalledTimes(totalEmails);
  });

  it('Should correctly replace the "To" header for BCC recipients', async () => {
    const bccAddress = "bcc1@example.com";
    const emlContent = createTestEml(
      "from@test.com",
      "original-to@test.com",
      "bcc-replace-test",
      bccAddress,
    );
    mockS3GetObject(emlContent);
    sesSendSpy.mockResolvedValue({ MessageId: "fake-id" });
    dynamoDBSpy.mockResolvedValue(undefined);
    const s3Event = createS3Event("test.eml");

    await handler(s3Event);

    const sesSendCalls = sesSendSpy.mock.calls;
    expect(sesSendCalls.length).toBe(2);

    const decoder = new TextDecoder();

    // The SendRawEmailCommand instance is the first argument passed to the spy
    const firstCallCommand = sesSendCalls[0][0] as SendRawEmailCommand;
    const firstCallEmail = decoder.decode(
      firstCallCommand.input.RawMessage.Data,
    );
    expect(firstCallEmail).toContain("To: original-to@test.com");
    expect(firstCallEmail).not.toContain("BCC:");

    // Check the second call for the BCC recipient
    const secondCallCommand = sesSendCalls[1][0] as SendRawEmailCommand;
    const secondCallEmail = decoder.decode(
      secondCallCommand.input.RawMessage.Data,
    );
    expect(secondCallEmail).toContain(`To: ${bccAddress}`);
  });

  it("Should not send an email if it was already sent", async () => {
    const emlContent = createTestEml("from@test.com", "to@test.com", "no-bcc");
    mockS3GetObject(emlContent);
    sesSendSpy.mockResolvedValue({ MessageId: "fake-id" });
    dynamoDBSpy.mockResolvedValue({ Item: { eventID: { S: "test-id" } } });
    const s3Event = createS3Event("test.eml");
    mockS3GetObject(emlContent);

    const response = await handler(s3Event);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toContain("Event already processed");
  });
});

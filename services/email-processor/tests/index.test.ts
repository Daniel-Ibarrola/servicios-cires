import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from "vitest";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { SNSEvent, SNSEventRecord } from "aws-lambda";
import { handler } from "../src";

/**
 * Helper function to create a properly typed SNSEvent for testing
 */
function createSNSEvent(messages: string[]): SNSEvent {
  const records: SNSEventRecord[] = messages.map((message) => ({
    EventVersion: "1.0",
    EventSubscriptionArn: "arn:aws:sns:us-east-1:123456789012:test-topic",
    EventSource: "aws:sns",
    Sns: {
      SignatureVersion: "1",
      Timestamp: "2026-01-31T23:55:12.000Z",
      Signature: "test-signature",
      SigningCertUrl: "https://sns.us-east-1.amazonaws.com/cert.pem",
      MessageId: "test-message-id",
      Message: message,
      MessageAttributes: {},
      Type: "Notification",
      UnsubscribeUrl: "https://sns.us-east-1.amazonaws.com/unsubscribe",
      TopicArn: "arn:aws:sns:us-east-1:123456789012:test-topic",
      Subject: "Amazon SES Email Event Notification",
    },
  }));

  return {
    Records: records,
  };
}

let snsSendSpy: MockInstance;

describe("Email Processor Handler - Unit Tests", () => {
  beforeEach(() => {
    snsSendSpy = vi.spyOn(SNSClient.prototype, "send");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should parse a bounce event and publish a readable message to the second SNS topic", async () => {
    snsSendSpy.mockResolvedValue({});

    const sesBounceMessage = {
      notificationType: "Bounce",
      bounce: {
        bounceType: "Transient",
        bounceSubType: "MailboxFull",
        bouncedRecipients: [
          {
            emailAddress: "albertoj8902@gmail.com",
            status: "4.4.7",
            diagnosticCode: "smtp; 554 4.4.7 Message expired...",
          },
        ],
        timestamp: "2026-01-31T23:55:12.000Z",
      },
      mail: {
        messageId: "0100019c137a5d98-000000",
        commonHeaders: {
          subject: "SASMEX MEX: Informe Reciente 8",
        },
      },
    };

    const event = createSNSEvent([JSON.stringify(sesBounceMessage)]);

    await handler(event);

    expect(snsSendSpy).toHaveBeenCalledTimes(1);

    // Verify the command input
    const command = snsSendSpy.mock.calls[0][0] as PublishCommand;
    expect(command.input.TopicArn).toBe(process.env.READABLE_TOPIC_ARN);
    expect(command.input.Subject).toBe(
      "[SES Alert] Bounce: SASMEX MEX: Informe Reciente 8",
    );
    expect(command.input.Message).toContain("⚠️ SES Bounce Notification");
    expect(command.input.Message).toContain("MailboxFull");
    expect(command.input.Message).toContain("albertoj8902@gmail.com");
  });

  it("should ignore non-bounce notification types like Delivery", async () => {
    const sesDeliveryMessage = {
      notificationType: "Delivery",
      delivery: { timestamp: "2026-01-31T23:55:12.000Z" },
    };

    const event = createSNSEvent([JSON.stringify(sesDeliveryMessage)]);

    await handler(event);

    expect(snsSendSpy).not.toHaveBeenCalled();
  });

  it("should handle multiple bounce records in a single SNS event", async () => {
    snsSendSpy.mockResolvedValue({});

    const bounceMsg = (id: string) =>
      JSON.stringify({
        notificationType: "Bounce",
        bounce: {
          bounceType: "Hard",
          bounceSubType: "General",
          bouncedRecipients: [],
          timestamp: "...",
        },
        mail: { messageId: id, commonHeaders: { subject: `Test ${id}` } },
      });

    const event = createSNSEvent([bounceMsg("1"), bounceMsg("2")]);

    await handler(event);

    expect(snsSendSpy).toHaveBeenCalledTimes(2);
  });
});

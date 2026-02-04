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
import { SNSEvent } from "aws-lambda";
import { handler } from "../src";

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

    const event: Partial<SNSEvent> = {
      Records: [
        {
          Sns: {
            Message: JSON.stringify(sesBounceMessage),
          },
        } as any,
      ],
    };

    await handler(event as SNSEvent);

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

    const event: Partial<SNSEvent> = {
      Records: [
        {
          Sns: {
            Message: JSON.stringify(sesDeliveryMessage),
          },
        } as any,
      ],
    };

    await handler(event as SNSEvent);

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

    const event: Partial<SNSEvent> = {
      Records: [
        { Sns: { Message: bounceMsg("1") } } as any,
        { Sns: { Message: bounceMsg("2") } } as any,
      ],
    };

    await handler(event as SNSEvent);

    expect(snsSendSpy).toHaveBeenCalledTimes(2);
  });
});

import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { SNSEvent, SESMessage } from "aws-lambda";

const sns = new SNSClient({ region: process.env.AWS_REGION });
const READABLE_TOPIC_ARN = process.env.READABLE_TOPIC_ARN!;

/**
 * Represents the SES notification payload when delivered via SNS.
 * The SNS 'Message' field contains this JSON structure.
 */
interface SESNotification extends SESMessage {
  notificationType: "Bounce" | "Complaint" | "Delivery";
  bounce: {
    bounceType: string;
    bounceSubType: string;
    bouncedRecipients: Array<{
      emailAddress: string;
      action?: string;
      status?: string;
      diagnosticCode?: string;
    }>;
    timestamp: string;
    feedbackId: string;
    remoteMtaIp?: string;
    reportingMTA?: string;
  };
}

/**
 * AWS Lambda handler that processes SES bounce notifications received via SNS.
 * It parses the SES message, formats the bounce details into a human-readable message,
 * and publishes it to a designated SNS topic for alerting.
 */
export const handler = async (event: SNSEvent) => {
  for (const record of event.Records) {
    const sesMessage = JSON.parse(record.Sns.Message) as SESNotification;

    if (sesMessage.notificationType === "Bounce") {
      const bounce = sesMessage.bounce;
      const mail = sesMessage.mail;
      const subject = mail.commonHeaders?.subject || "No Subject";

      const recipientList = bounce.bouncedRecipients
        .map((r) => `- ${r.emailAddress}: ${r.diagnosticCode || r.status}`)
        .join("\n");

      const messageText = `
⚠️ SES Bounce Notification

Original Subject: ${subject}
Bounce Type: ${bounce.bounceType} (${bounce.bounceSubType})
Time: ${bounce.timestamp}

Bounced Recipients:
${recipientList}

---
Message ID: ${mail.messageId}
      `.trim();

      await sns.send(
        new PublishCommand({
          TopicArn: READABLE_TOPIC_ARN,
          Subject: `[SES Alert] Bounce: ${subject}`,
          Message: messageText,
        }),
      );
    }
  }
};

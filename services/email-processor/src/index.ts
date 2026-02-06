import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { SNSEvent } from "aws-lambda";
import {
  SESNotification,
  Bounce,
  Complaint,
  Receipt,
} from "./ses-notification";
import dedent from "dedent";

const sns = new SNSClient({ region: process.env.AWS_REGION });
const READABLE_TOPIC_ARN = process.env.READABLE_TOPIC_ARN!;

/**
 * AWS Lambda handler that processes SES notifications (bounces, complaints, replies) received via SNS.
 * It parses the SES message, formats the details into a human-readable message,
 * and publishes it to a designated SNS topic for alerting.
 */
export const handler = async (event: SNSEvent) => {
  console.log("Received new SNS event");
  for (const record of event.Records) {
    const sesMessage = JSON.parse(record.Sns.Message) as SESNotification;
    console.log(`Processing SES notification: ${sesMessage.notificationType}`);

    if (sesMessage.notificationType === "Bounce") {
      const bounce = sesMessage.bounce as Bounce;
      const mail = sesMessage.mail;
      const subject = mail.commonHeaders?.subject || "No Subject";

      const recipientList = bounce.bouncedRecipients
        .map((r) => `- ${r.emailAddress}: ${r.diagnosticCode || r.status}`)
        .join("\n");

      const messageText = dedent`
      ⚠️ SES Bounce Notification
      
      Original Subject: ${subject}
      Bounce Type: ${bounce.bounceType} (${bounce.bounceSubType})
      Time: ${bounce.timestamp}
      
      Bounced Recipients:
      ${recipientList}
      
      ---
      Message ID: ${mail.messageId}
      Feedback ID: ${bounce.feedbackId}
      `.trim();

      await sns.send(
        new PublishCommand({
          TopicArn: READABLE_TOPIC_ARN,
          Subject: `[SES Alert] Bounce: ${subject}`,
          Message: messageText,
        }),
      );
    } else if (sesMessage.notificationType === "Complaint") {
      const complaint = sesMessage.complaint as Complaint;
      const mail = sesMessage.mail;
      const subject = mail.commonHeaders?.subject || "No Subject";

      const recipientList = complaint.complainedRecipients
        .map((r) => `- ${r.emailAddress}`)
        .join("\n");

      const messageText = dedent`
      🚨 SES Complaint Notification
      
      Original Subject: ${subject}
      Time: ${complaint.timestamp}
      Complaint Type: ${complaint.complaintFeedbackType || "Not specified"}
      User Agent: ${complaint.userAgent || "Not specified"}
      
      Complained Recipients:
      ${recipientList}
      
      ---
      Message ID: ${mail.messageId}
      Feedback ID: ${complaint.feedbackId}
      `.trim();

      await sns.send(
        new PublishCommand({
          TopicArn: READABLE_TOPIC_ARN,
          Subject: `[SES Alert] Complaint: ${subject}`,
          Message: messageText,
        }),
      );
    } else if (sesMessage.notificationType === "Received") {
      const mail = sesMessage.mail;
      const receipt = sesMessage.receipt as Receipt;
      const subject = mail.commonHeaders?.subject || "No Subject";
      const from = mail.commonHeaders?.from?.join(", ") || "Unknown";
      const to = mail.commonHeaders?.to?.join(", ") || "Unknown";

      const messageText = dedent`
      📧 Email Received (Reply)
      
      Subject: ${subject}
      From: ${from}
      To: ${to}
      Time: ${receipt.timestamp}
      
      Recipients: ${receipt.recipients.join(", ")}
      
      Spam Verdict: ${receipt.spamVerdict.status}
      Virus Verdict: ${receipt.virusVerdict.status}
      SPF Verdict: ${receipt.spfVerdict.status}
      DKIM Verdict: ${receipt.dkimVerdict.status}
      DMARC Verdict: ${receipt.dmarcVerdict.status}
      
      ---
      Message ID: ${mail.messageId}
      `.trim();

      await sns.send(
        new PublishCommand({
          TopicArn: READABLE_TOPIC_ARN,
          Subject: `[SES] Reply: ${subject}`,
          Message: messageText,
        }),
      );
    } else {
      console.warn(
        `Unsupported notification type: ${sesMessage.notificationType}`,
      );
    }
  }
};

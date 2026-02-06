import { SESMessage } from "aws-lambda";

/**
 * Bounce recipient details
 * https://docs.aws.amazon.com/ses/latest/dg/notification-contents.html#bounced-recipients
 */
interface BouncedRecipient {
  emailAddress: string;
  action?: string;
  status?: string;
  diagnosticCode?: string;
}

/**
 * Bounce object
 * https://docs.aws.amazon.com/ses/latest/dg/notification-contents.html#bounce-object
 */
export interface Bounce {
  bounceType: "Undetermined" | "Permanent" | "Transient";
  bounceSubType: string;
  bouncedRecipients: BouncedRecipient[];
  timestamp: string;
  feedbackId: string;
  remoteMtaIp?: string;
  reportingMTA?: string;
}

/**
 * Complained recipient details
 * https://docs.aws.amazon.com/ses/latest/dg/notification-contents.html#complained-recipients
 */
interface ComplainedRecipient {
  emailAddress: string;
}

/**
 * Complaint object
 * https://docs.aws.amazon.com/ses/latest/dg/notification-contents.html#complaint-object
 */
export interface Complaint {
  complainedRecipients: ComplainedRecipient[];
  timestamp: string;
  feedbackId: string;
  userAgent?: string;
  complaintFeedbackType?: string;
  arrivalDate?: string;
}

/**
 * Receipt object for received emails
 * https://docs.aws.amazon.com/ses/latest/dg/receiving-email-notifications-contents.html
 */
export interface Receipt {
  timestamp: string;
  processingTimeMillis: number;
  recipients: string[];
  spamVerdict: { status: string };
  virusVerdict: { status: string };
  spfVerdict: { status: string };
  dkimVerdict: { status: string };
  dmarcVerdict: { status: string };
  action: {
    type: string;
    topicArn?: string;
  };
}

/**
 * Represents the SES notification payload when delivered via SNS.
 * The SNS 'Message' field contains this JSON structure.
 * https://docs.aws.amazon.com/ses/latest/dg/notification-contents.html
 */
export interface SESNotification {
  notificationType: "Bounce" | "Complaint" | "Delivery" | "Received";
  mail: SESMessage["mail"];
  bounce?: Bounce;
  complaint?: Complaint;
  receipt?: Receipt;
  content?: string;
}

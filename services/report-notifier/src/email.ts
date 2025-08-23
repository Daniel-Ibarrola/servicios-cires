import { SendRawEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { sleep } from "./utils";

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
});

export const removeEmailHeaders = (email: string): string => {
  return email.replace(/^From:.*\r?\n/m, "").replace(/^BCC:.*\r?\n/m, "");
};

export const extractBCC = (email: string): string[] => {
  const bccMatch = email.match(/^BCC:\s*(.*?)\r?\n/m);

  if (!bccMatch) {
    return [];
  }

  const bccValue = bccMatch[1].trim();
  return bccValue.split(",").map((addr) => addr.trim());
};

export const replaceTo = (email: string, to: string): string => {
  return email.replace(/^To:.*\r?\n/m, `To: ${to}\r\n`);
};

export const sendEmail = async (
  email: string,
  sender: string,
): Promise<string | undefined> => {
  const encodedEmail = new TextEncoder().encode(email);
  const sendRawEmailCmd = new SendRawEmailCommand({
    Source: sender,
    RawMessage: { Data: encodedEmail },
  });
  const sesResponse = await sesClient.send(sendRawEmailCmd);
  return sesResponse.MessageId;
};

export const sendAllEmails = async (
  email: string,
  senderEmail: string,
): Promise<[number, number]> => {
  const bcc = extractBCC(email);
  email = removeEmailHeaders(email);

  const messageId = await sendEmail(email, senderEmail);
  let sentEmailCount = 1;

  console.log(`SUCCESS: Email sent via SES. Message ID: ${messageId}`);
  console.log("BBC addresses: ", bcc);

  for (const bccAddr of bcc) {
    await sleep(150);
    const newEmail = replaceTo(email, bccAddr);
    try {
      const messageId = await sendEmail(newEmail, senderEmail);
      console.log(
        `SUCCESS: Email sent via SES. Message ID: ${messageId} (BCC: ${bccAddr})`,
      );
      sentEmailCount++;
    } catch (e) {
      console.log(`ERROR: Failed to send email to ${bccAddr}`);
    }
  }

  const totalEmails = 1 + bcc.length;
  return [sentEmailCount, totalEmails];
};

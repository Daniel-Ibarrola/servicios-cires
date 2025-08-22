import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
import { S3Event, S3EventRecord } from "aws-lambda";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
});

/**
 * Helper to convert a stream to a Uint8Array.
 */
const streamToUint8Array = (stream: any): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });

const getEmailFileContents = async (
  s3EventRecord: S3EventRecord,
): Promise<string> => {
  const bucket = s3EventRecord.s3.bucket.name;
  const key = decodeURIComponent(
    s3EventRecord.s3.object.key.replace(/\+/g, " "),
  );

  console.log(`New .eml file detected. Bucket: ${bucket}, Key: ${key}`);

  const getObjectCmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const s3Response = await s3Client.send(getObjectCmd);
  const rawEmailData = await streamToUint8Array(s3Response.Body);

  return new TextDecoder().decode(rawEmailData);
};

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

const sendEmail = async (
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

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const handler = async (
  event: S3Event,
): Promise<{ statusCode: number; body: string }> => {
  const senderEmail = process.env.VERIFIED_SENDER;

  if (!senderEmail) {
    throw new Error("VERIFIED_SENDER environment variable is not set");
  }

  console.log("Received S3 event:", JSON.stringify(event, null, 2));

  let email = await getEmailFileContents(event.Records[0]);
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
  const bodyMessage = `Sent ${sentEmailCount} out of ${totalEmails} email(s) successfully`;

  console.log(bodyMessage);
  console.log("=========================================");

  return {
    statusCode: 200,
    body: bodyMessage,
  };
};

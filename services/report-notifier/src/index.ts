import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
import { S3Event } from "aws-lambda";

const s3Client = new S3Client({});
const sesClient = new SESClient({});

const SENDER_EMAIL = process.env.VERIFIED_SENDER;

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

export const handler = async (
  event: S3Event,
): Promise<{ statusCode: number; body: string }> => {
  if (!SENDER_EMAIL) {
    throw new Error("VERIFIED_SENDER environment variable is not set");
  }

  console.log("Received S3 event:", JSON.stringify(event, null, 2));

  const record = event.Records[0];
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

  console.log(`New .eml file detected. Bucket: ${bucket}, Key: ${key}`);

  const getObjectCmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const s3Response = await s3Client.send(getObjectCmd);
  const rawEmailData = await streamToUint8Array(s3Response.Body);

  const sendRawEmailCmd = new SendRawEmailCommand({
    Source: SENDER_EMAIL,
    RawMessage: { Data: rawEmailData },
  });
  const sesResponse = await sesClient.send(sendRawEmailCmd);

  const messageId = sesResponse.MessageId;
  console.log(`SUCCESS: Email sent via SES. Message ID: ${messageId}`);

  return {
    statusCode: 200,
    body: `Email sent successfully! Message ID: ${messageId}`,
  };
};

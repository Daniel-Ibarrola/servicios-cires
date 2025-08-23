import { S3EventRecord } from "aws-lambda";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

const streamToUint8Array = (stream: any): Promise<Uint8Array> =>
  new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on("data", (chunk: any) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });

export const retrieveFileFromS3 = async (
  s3EventRecord: S3EventRecord,
): Promise<string> => {
  const bucket = s3EventRecord.s3.bucket.name;
  const key = decodeURIComponent(
    s3EventRecord.s3.object.key.replace(/\+/g, " "),
  );

  console.log(`New file detected. Bucket: ${bucket}, Key: ${key}`);

  const getObjectCmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const s3Response = await s3Client.send(getObjectCmd);
  const rawFileData = await streamToUint8Array(s3Response.Body);

  return new TextDecoder().decode(rawFileData);
};

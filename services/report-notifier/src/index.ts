import { S3Event } from "aws-lambda";
import { retrieveFileFromS3 } from "./s3";
import { sendAllEmails } from "./email";
import { isEventProcessed, recordEventInDB } from "./event-tracker";

export const handler = async (
  event: S3Event,
): Promise<{ statusCode: number; body: string }> => {
  const senderEmail = process.env.VERIFIED_SENDER;
  const tableName = process.env.EVENT_TRACKER_TABLE_NAME;
  console.log("Sender email: ", senderEmail);
  console.log("Table name: ", tableName);

  if (!senderEmail) {
    throw new Error("VERIFIED_SENDER environment variable is not set");
  }

  if (!tableName) {
    throw new Error("EVENT_TRACKER_TABLE_NAME environment variable is not set");
  }

  const eventKey = event.Records[0].s3.object.eTag;
  if (await isEventProcessed(eventKey, tableName)) {
    console.log("Event already processed. Skipping.");
    return {
      statusCode: 200,
      body: "Event already processed. Skipping.",
    };
  }

  console.log("Received S3 event:", JSON.stringify(event, null, 2));

  let email = await retrieveFileFromS3(event.Records[0]);
  const [sentEmailCount, totalEmails] = await sendAllEmails(email, senderEmail);

  await recordEventInDB(eventKey, tableName);
  console.log(`Event with key ${eventKey} recorded in DB`);

  const bodyMessage = `Sent ${sentEmailCount} out of ${totalEmails} email(s) successfully`;
  console.log(bodyMessage);

  return {
    statusCode: 200,
    body: bodyMessage,
  };
};

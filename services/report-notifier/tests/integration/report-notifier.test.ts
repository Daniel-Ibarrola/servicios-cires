import { describe, test, expect } from "vitest";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { v4 as uuidv4 } from "uuid";
import { createTestEml } from "../utils/create-test-eml";

const AWS_REGION = "us-east-1";
const VERIFIED_SENDER = "test@servicios-cires.net";
const BUCKET_NAME = "cires-reports-stage";
const LOG_GROUP_NAME = "/aws/lambda/report-notifier-stage";

const s3Client = new S3Client({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Report Notifier", () => {
  test(
    "Sends email with object contents when uploaded to bucket",
    { timeout: 70000 },
    async () => {
      const testId = uuidv4();
      const objectKey = `test-email-${testId}.eml`;
      const toAddress = "success@simulator.amazonses.com";
      const emlContent = createTestEml(VERIFIED_SENDER, toAddress, testId);

      console.log(`Test ID: ${testId}`);
      console.log(`Uploading '${objectKey}' to bucket '${BUCKET_NAME}'...`);

      const putCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: objectKey,
        Body: emlContent,
      });
      await s3Client.send(putCommand);

      // 3. VERIFICATION - Poll CloudWatch logs for the success message
      console.log(`Verifying logs in log group: ${LOG_GROUP_NAME}`);

      const startTime = Date.now();
      const maxWaitSeconds = 60;
      let foundLog = false;
      const filterPattern = `"SUCCESS: Email sent via SES."`;

      console.log("FILTER PATTERN:");
      console.log(filterPattern);

      while (Date.now() - startTime < maxWaitSeconds * 1000) {
        const filterCommand = new FilterLogEventsCommand({
          logGroupName: LOG_GROUP_NAME,
          startTime: startTime - 60 * 1000, // Search logs from 1 minute before test start
          filterPattern: filterPattern,
        });

        const response = await logsClient.send(filterCommand);

        if (response.events && response.events.length > 0) {
          console.log("Success log found!");
          foundLog = true;
          // Optionally, assert on the log message content
          expect(response.events[0].message).toContain(
            "SUCCESS: Email sent via SES",
          );
          return;
        }

        console.log("Log not found yet, waiting 5 seconds...");
        await sleep(5000);
      }

      throw new Error("Log not found");
    },
  );
});

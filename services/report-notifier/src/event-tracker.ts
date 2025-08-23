import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";

const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});

interface NotificationEvent {
  eventID: { S: string };
  processedAt: { S: string };
  expirationTime: { N: string };
}

/**
 * Inserts a record into DynamoDB to track a processed event.
 * @param eventId The unique identifier for the event (e.g., S3 object eTag or a message ID).
 * @param tableName The name of the DynamoDB table.
 * @param ttlDays The number of days until the record should automatically be deleted.
 */
export const recordEventInDB = async (
  eventId: string,
  tableName: string,
  ttlDays: number = 30,
): Promise<void> => {
  // Calculate the expiration timestamp (in seconds) for the TTL
  const ttl = Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60;

  const command = new PutItemCommand({
    TableName: tableName,
    Item: {
      eventID: { S: eventId },
      expirationTime: { N: ttl.toString() },
      processedAt: { S: new Date().toISOString() },
    },
    ConditionExpression: "attribute_not_exists(eventID)",
  });

  await dynamoDBClient.send(command);
};

const getEventFromDB = async (
  eventId: string,
  tableName: string,
): Promise<NotificationEvent | undefined> => {
  const command = new GetItemCommand({
    TableName: tableName,
    Key: {
      eventID: { S: eventId },
    },
  });
  const response = await dynamoDBClient.send(command);
  return response?.Item as NotificationEvent | undefined;
};

export const isEventProcessed = async (
  eventId: string,
  tableName: string,
): Promise<boolean> => {
  const event = await getEventFromDB(eventId, tableName);
  return event !== undefined;
};

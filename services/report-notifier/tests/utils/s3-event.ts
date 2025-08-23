import { S3Event } from "aws-lambda";

export const createS3Event = (objectKey: string, etag?: string): S3Event => ({
  Records: [
    {
      eventVersion: "2.1",
      eventSource: "aws:s3",
      awsRegion: "us-east-1",
      eventTime: "2025-07-13T23:54:51.649Z",
      eventName: "ObjectCreated:Put",
      userIdentity: {
        principalId: "AWS:AIDAZXED6X554HXKZSHP2",
      },
      requestParameters: {
        sourceIPAddress: "201.133.240.187",
      },
      responseElements: {
        "x-amz-request-id": "F61FEXJGHG3E1EKK",
        "x-amz-id-2":
          "/WMcTGjvQWLDBWh9HFFtllu1+KNOO4Rq6czbW48nlXt5Q5RW/rjxkyCAsk73ojmMlQz+AmQwsqJBKuFEoLHfKarpnK3ABHQh",
      },
      s3: {
        s3SchemaVersion: "1.0",
        configurationId: "tf-s3-lambda-20250705162341231000000001",
        bucket: {
          name: "cires-reports-stage",
          ownerIdentity: {
            principalId: "A20CFJR3Q6TMFH",
          },
          arn: "arn:aws:s3:::cires-reports-stage",
        },
        object: {
          key: objectKey,
          size: 241,
          eTag: etag ?? "2a0416ba70673064f9c86b5c413129c7",
          sequencer: "006874474B8B9A4297",
        },
      },
    },
  ],
});

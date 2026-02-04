# Email Processor Service

This service is an AWS Lambda function that processes SES (Simple Email Service) bounce notifications. It listens for notifications sent via an SNS topic, formats them into a human-readable message, and republishes the result to another SNS topic for alerting or further processing.

## Functionality

- Receives SNS events containing SES bounce notifications.
- Parses the SES message and extracts bounce details (recipients, bounce type, subject, etc.).
- Formats a clear, human-readable notification message.
- Publishes the formatted message to a designated SNS topic.

## Environment Variables

The service requires the following environment variables:

| Variable | Description |
|----------|-------------|
| `AWS_REGION` | The AWS region where the SNS client will be initialized. |
| `READABLE_TOPIC_ARN` | The ARN of the SNS topic where human-readable notifications will be sent. |

## Development

### Scripts

- `npm run build`: Compiles the TypeScript code.
- `npm test`: Runs tests using Vitest in watch mode.
- `npm run test:ci`: Runs tests once using Vitest.

### Dependencies

- `@aws-sdk/client-sns`: AWS SDK for SNS interaction.
- `@types/aws-lambda`: Type definitions for AWS Lambda.

## Architecture Flow

1. **SES** sends a bounce notification to an **SNS Topic (Source)**.
2. **Lambda (Email Processor)** is triggered by the SNS Topic.
3. **Lambda** parses the event and formats the message.
4. **Lambda** publishes the formatted message to the **Readable SNS Topic (Destination)**.

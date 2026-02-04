# Email Service Module

## Overview
This module configures AWS Simple Email Service (SES) for the `servicios-cires.net` domain and sets up the infrastructure for handling email notifications and incoming mail.

Key features:
- Domain verification and DKIM setup.
- Bounce and Complaint notification routing via SNS.
- Human-readable bounce processing via a Lambda function.
- Incoming email reception and forwarding to SNS.

## Resources Created

### SES Configuration
- **SES Domain Identity**: Configures `servicios-cires.net`.
- **Domain Verification & DKIM**: Automatic DNS records for authentication.
- **Identity Notification Topics**: Links SES Bounce and Complaint events to SNS topics.
- **Receipt Rule Set**: Handles incoming emails sent to the domain.

### Infrastructure & Processing
- **SNS Topics**:
    - `ses-bounces`: Raw bounce notifications.
    - `ses-complaints`: Raw complaint notifications.
    - `ses-readable-notifications`: Formatted, human-readable alerts.
    - `email-replies`: Incoming emails forwarded from SES.
- **Lambda Function (`ses-bounce-processor`)**: Processes raw bounces from `ses-bounces` and publishes readable versions to `ses-readable-notifications`.
- **S3 Bucket (`cires-ses-bouce-processor-code`)**: Stores the deployment package for the bounce processor Lambda.
- **IAM Roles & Policies**: Necessary permissions for the Lambda to log to CloudWatch and publish to SNS.

## Usage

This module is the central email hub. Other services should:
1. Use SES for sending emails from the verified domain.
2. Subscribe to `ses-readable-notifications` for human alerts.
3. Subscribe to `ses-bounces` or `ses-complaints` for automated processing of delivery failures.

## Variables
| Name | Description | Type |
|------|-------------|------|
| `source_code_hash` | Base64-encoded SHA256 hash of the Lambda deployment package. | `string` |

## Important Notes
- The module uses the `cloudposse/ses/aws` module (v0.25.1).
- MX records are automatically configured to point to AWS inbound SMTP.
- The `ses-bounce-processor` Lambda expects a `bounce-processor.zip` file in the configured S3 bucket.
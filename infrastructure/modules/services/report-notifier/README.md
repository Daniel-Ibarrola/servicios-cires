# Report Notifier Module

## Overview
This module sets up the infrastructure for the report notification service, which monitors an S3 bucket for new earthquake reports and sends email notifications when new reports are uploaded. It creates both the Lambda function for processing notifications and the S3 bucket for storing reports.

## Resources Created
- **S3 Bucket**: Stores earthquake reports with lifecycle policies for automatic cleanup
- **Lambda Function**: Processes new file uploads and sends email notifications
- **IAM Roles and Policies**: Grants the Lambda function permissions to access S3 and send emails via SES
- **S3 Event Notifications**: Triggers the Lambda function when new files are uploaded to the bucket

## Input Variables
| Name | Description | Type | Required |
|------|-------------|------|----------|
| bucket_name | The name of the S3 bucket used to store reports | string | Yes |
| environment | The name of the environment (e.g., 'prod', 'stage') | string | Yes |
| verified_sender | The verified email address used to send notifications | string | Yes |

## Usage
This module is used in both stage and production environments to set up the report notification infrastructure. It should be called from environment-specific configurations.

```hcl
module "report-notifier" {
  source          = "../../../modules/services/report-notifier"
  bucket_name     = "cires-reports-prod"
  environment     = "prod"
  verified_sender = "cires@servicios-cires.net"
}
```

## Important Notes
- The S3 bucket has `prevent_destroy` set to true to avoid accidental deletion
- All public access to the bucket is blocked
- The Lambda function is packaged from the services/report-notifier/dist directory
- Objects in the S3 bucket are automatically deleted after 30 days
- The Lambda function is triggered by S3 ObjectCreated events
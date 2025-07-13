# IAM Module

## Overview
This module sets up AWS Identity and Access Management (IAM) resources for the CIRES services. It creates IAM users, policies, and attachments to enable secure access to AWS resources, specifically for uploading reports to S3 buckets.

## Resources Created
- **IAM User**: Creates a service user (cires-reports-uploader) for uploading reports to S3 buckets
- **IAM Policy**: Defines permissions for S3 bucket access with specific actions allowed
- **Policy Attachment**: Attaches the created policy to the service user

## Permissions Granted
The module grants the following permissions to the service user:
- `s3:PutObject` on both stage and production report buckets
- `s3:ListBucket` on both stage and production report buckets

## Usage
This module is used to manage access control for services that need to upload reports to the CIRES S3 buckets. The IAM user created by this module can be used by applications to authenticate with AWS and upload files.

```hcl
resource "aws_iam_user" "s3_upload_user" {
  name = "cires-reports-uploader"
  path = "/service-users/"

  tags = {
    Description = "User for uploading objects to CIRES report buckets"
    Environment = "Stage and Production"
  }
}
```

## Important Notes
- The IAM user is created with a specific path (/service-users/) for organizational purposes
- The policy is scoped to specific S3 buckets (cires-reports-stage and cires-reports-prod)
- The user has minimal permissions following the principle of least privilege
- This configuration is global and applies to both stage and production environments
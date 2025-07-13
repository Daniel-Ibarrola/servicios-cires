# Terraform Backend Module

## Overview
This module sets up the necessary AWS infrastructure for storing and managing Terraform state files. It creates an S3 bucket for state storage and a DynamoDB table for state locking, which are essential for team collaboration and state management in Terraform.

## Resources Created
- **S3 Bucket**: Stores the Terraform state files with versioning enabled
- **DynamoDB Table**: Provides locking functionality to prevent concurrent state modifications
- **Security Configurations**: Ensures the S3 bucket is properly secured with encryption and public access blocking

## Usage
This module is used as a backend for all other Terraform configurations in the project. It should be deployed first before any other infrastructure.

```hcl
terraform {
  backend "s3" {
    bucket         = "infrastructure-state-servicios-cires"
    key            = "your/state/path/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "infrastructure-servicios-cires-lock"
    encrypt        = true
  }
}
```

## Important Notes
- The S3 bucket has `prevent_destroy` set to true to avoid accidental deletion
- Server-side encryption is enabled with AES256
- All public access to the bucket is blocked
- The DynamoDB table uses on-demand capacity (PAY_PER_REQUEST billing mode)
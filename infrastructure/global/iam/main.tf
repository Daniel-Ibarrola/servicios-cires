terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.100"
    }
  }
  required_version = ">= 1.0"
}

terraform {
  backend "s3" {
    bucket         = "infrastructure-state-servicios-cires"
    key            = "global/iam/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "infrastructure-servicios-cires-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_iam_user" "s3_upload_user" {
  name = "cires-reports-uploader"
  path = "/service-users/"

  tags = {
    Description = "User for uploading objects to CIRES report buckets"
    Environment = "Stage and Production"
  }
}

data "aws_iam_policy_document" "s3_upload_policy_doc" {
  statement {
    sid    = "AllowS3Uploads"
    effect = "Allow"

    actions = [
      "s3:PutObject",
    ]

    resources = [
      "arn:aws:s3:::cires-reports-stage/*",
      "arn:aws:s3:::cires-reports-prod/*"
    ]
  }

  statement {
    sid    = "AllowBucketListing"
    effect = "Allow"

    actions = [
      "s3:ListBucket",
    ]

    resources = [
      "arn:aws:s3:::cires-reports-stage",
      "arn:aws:s3:::cires-reports-prod"
    ]
  }
}

resource "aws_iam_policy" "s3_upload_policy" {
  name        = "cires-reports-upload-policy"
  description = "Policy allowing uploading objects to CIRES report buckets"
  policy      = data.aws_iam_policy_document.s3_upload_policy_doc.json
}

resource "aws_iam_user_policy_attachment" "s3_upload_policy_attachment" {
  user       = aws_iam_user.s3_upload_user.name
  policy_arn = aws_iam_policy.s3_upload_policy.arn
}

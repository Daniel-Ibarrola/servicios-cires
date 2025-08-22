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

  lifecycle {
    ignore_changes = [
      tags,
      tags_all,
    ]
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

# Create an IAM OIDC identity provider that trusts GitHub
resource "aws_iam_openid_connect_provider" "github_actions" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [
    data.tls_certificate.github.certificates[0].sha1_fingerprint
  ]
}

# Fetch GitHub's OIDC thumbprint
data "tls_certificate" "github" {
  url = "https://token.actions.githubusercontent.com"
}


locals {
  github_owner = "Daniel-Ibarrola"
  allowed_repos = ["servicios-cires"]
}

data "aws_iam_policy_document" "assume_role_policy" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    principals {
      identifiers = [aws_iam_openid_connect_provider.github_actions.arn]
      type        = "Federated"
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      # The repos and branches defined in allowed_repos_branches
      # will be able to assume this IAM role
      values = [
        for repo in local.allowed_repos :
        "repo:${local.github_owner}/${repo}:*"
      ]
    }
  }
}

resource "aws_iam_role" "github_actions_terraform_role" {
  name = "github-actions-terraform-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json
}


data "aws_iam_policy_document" "terraform_permissions" {
  # Permissions for the Terraform State Backend
  statement {
    sid    = "TerraformState"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:ListBucket"
    ]
    resources = [
      "arn:aws:s3:::infrastructure-state-servicios-cires",
      "arn:aws:s3:::infrastructure-state-servicios-cires/*"
    ]
  }

  statement {
    sid    = "Artifacts"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:ListBucket"
    ]
    resources = [
      "arn:aws:s3:::cires-report-notifier-source-code-stage",
      "arn:aws:s3:::cires-report-notifier-source-code-stage/*",
      "arn:aws:s3:::cires-report-notifier-source-code-prod",
      "arn:aws:s3:::cires-report-notifier-source-code-prod/*"
    ]
  }

  statement {
    sid    = "TerraformStateLock"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem"
    ]
    resources = ["arn:aws:dynamodb:*:*:table/infrastructure-servicios-cires-lock"]
  }

  statement {
    sid    = "IAM"
    effect = "Allow"
    actions = [
      "iam:CreateRole",
      "iam:GetRole",
      "iam:DeleteRole",
      "iam:TagRole",
      "iam:CreateUser",
      "iam:GetUser",
      "iam:DeleteUser",
      "iam:TagUser",
      "iam:CreatePolicy",
      "iam:GetPolicy",
      "iam:DeletePolicy",
      "iam:AttachRolePolicy",
      "iam:DetachRolePolicy",
      "iam:AttachUserPolicy",
      "iam:DetachUserPolicy",
      "iam:PassRole",
      "iam:GetPolicyVersion",
      "iam:ListRolePolicies",
      "iam:ListAttachedRolePolicies"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "S3"
    effect = "Allow"
    actions = [
      "s3:*"
    ]
    resources = [
      "arn:aws:s3:::*"
    ]
  }

  statement {
    sid    = "Lambda"
    effect = "Allow"
    actions = [
      "lambda:*",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "CloudTrail"
    effect = "Allow"
    actions = [
      "cloudtrail:*"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "terraform_permissions_policy" {
  name        = "terraform-permissions-policy"
  description = "Permissions for the GitHub Actions Terraform role."
  policy      = data.aws_iam_policy_document.terraform_permissions.json
}


resource "aws_iam_role_policy_attachment" "terraform_role_attachment" {
  role       = aws_iam_role.github_actions_terraform_role.name
  policy_arn = aws_iam_policy.terraform_permissions_policy.arn
}

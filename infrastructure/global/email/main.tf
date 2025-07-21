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
    key            = "global/email/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "infrastructure-servicios-cires-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-1"
}

locals {
  domain = "servicios-cires.net"
  zone_id = "Z06509101Z22NMKSMXDLL"
}

module "ses" {
  source  = "cloudposse/ses/aws"
  version = "0.25.1"

  domain        = local.domain
  zone_id       = local.zone_id
  verify_dkim   = true
  verify_domain = true

  ses_group_enabled = false
  ses_user_enabled  = false

  namespace   = "cires"
  environment = "us-east-1"
}

resource "aws_sns_topic" "ses_bounces" {
  name = "ses-bounces"
}

resource "aws_sns_topic" "ses_complaints" {
  name = "ses-complaints"
}

resource "aws_ses_identity_notification_topic" "bounce_topic" {
  identity                 = module.ses.ses_domain_identity_arn
  notification_type        = "Bounce"
  topic_arn                = aws_sns_topic.ses_bounces.arn
  include_original_headers = true
}

resource "aws_ses_identity_notification_topic" "complaint_topic" {
  identity                 = module.ses.ses_domain_identity_arn
  notification_type        = "Complaint"
  topic_arn                = aws_sns_topic.ses_complaints.arn
  include_original_headers = true
}

resource "aws_sns_topic" "email_replies" {
  name = "email-replies"
}

resource "aws_ses_receipt_rule_set" "default" {
  rule_set_name = "default-rule-set"
}

resource "aws_ses_receipt_rule" "email_forwarding_rule" {
  name          = "forward-incoming-to-sns"
  rule_set_name = aws_ses_receipt_rule_set.default.rule_set_name
  enabled       = true
  recipients    = ["servicios-cires.net"]

  sns_action {
    topic_arn = aws_sns_topic.email_replies.arn
    position  = 1
  }

  scan_enabled = true
  tls_policy   = "Optional"
}

resource "aws_ses_active_receipt_rule_set" "active" {
  rule_set_name = aws_ses_receipt_rule_set.default.rule_set_name
}

resource "aws_route53_record" "mx" {
  zone_id = local.zone_id
  name    = local.domain
  type    = "MX"
  ttl     = 300
  records = ["10 inbound-smtp.us-east-1.amazonaws.com"]
}
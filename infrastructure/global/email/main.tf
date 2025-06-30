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

module "ses" {
  source  = "cloudposse/ses/aws"
  version = "0.25.1"

  domain        = "servicios-cires.net"
  zone_id       = "Z06509101Z22NMKSMXDLL"
  verify_dkim   = true
  verify_domain = true

  ses_group_enabled = false
  ses_user_enabled  = false

  namespace   = "cires"
  environment = "us-east-1"
}
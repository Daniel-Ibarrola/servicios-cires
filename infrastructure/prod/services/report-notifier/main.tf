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
    key            = "prod/services/report-notifier/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "infrastructure-servicios-cires-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-1"
}

module "report-notifier" {
  source      = "../../../modules/services/report-notifier"
  bucket_name = "cires-reports-prod"
  environment = "prod"
  verified_sender = "cires@servicios-cires.net"
}
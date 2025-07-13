# Email Service Module

## Overview
This module configures AWS Simple Email Service (SES) for the servicios-cires.net domain. It sets up the necessary domain verification and DKIM records to ensure proper email delivery and authentication.

## Resources Created
- **SES Domain Identity**: Configures the servicios-cires.net domain for use with AWS SES
- **Domain Verification**: Sets up DNS records to verify domain ownership
- **DKIM Configuration**: Enables DomainKeys Identified Mail (DKIM) for improved email deliverability and security

## Usage
This module is used as a foundation for email sending capabilities in the project. Other services that need to send emails should reference the SES configuration created by this module.

```hcl
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
```

## Important Notes
- The module uses the cloudposse/ses/aws module from the Terraform Registry
- Both domain verification and DKIM verification are enabled
- No SES users or groups are created by this module
- The configuration is global and used by services across all environments
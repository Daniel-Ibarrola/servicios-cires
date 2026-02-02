# DynamoDB table to store processed S3 event IDs to ensure idempotency
resource "aws_dynamodb_table" "event_tracker" {
  name         = "report-notifier-events-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "eventID"

  attribute {
    name = "eventID"
    type = "S"
  }

  # Enable Time to Live (TTL) on the table
  ttl {
    enabled        = true
    attribute_name = "expirationTime"
  }

  tags = {
    Environment = var.environment
    Application = "report-notifier"
  }
}

resource "aws_sns_topic" "readable_notifications" {
  name = "ses-readable-notifications"
}

resource "aws_s3_bucket" "bounce_processor_source_code" {
  bucket = "cires-ses-bouce-processor-code"
}

resource "aws_lambda_function" "bounce_processor" {
  function_name = "ses-bounce-processor"
  role          = aws_iam_role.bounce_processor_role.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"

  s3_bucket        = aws_s3_bucket.bounce_processor_source_code.bucket
  s3_key           = "bounce-processor.zip"
  source_code_hash = var.source_code_hash

  environment {
    variables = {
      READABLE_TOPIC_ARN = aws_sns_topic.readable_notifications.arn
    }
  }
}

resource "aws_iam_role" "bounce_processor_role" {
  name = "ses_bounce_processor_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "bounce_processor_policy" {
  name = "ses_bounce_processor_policy"
  role = aws_iam_role.bounce_processor_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = ["sns:Publish"]
        Resource = [aws_sns_topic.readable_notifications.arn]
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "lambda_to_raw" {
  topic_arn = aws_sns_topic.ses_bounces.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.bounce_processor.arn
}

resource "aws_lambda_permission" "sns_to_lambda" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.bounce_processor.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.ses_bounces.arn
}

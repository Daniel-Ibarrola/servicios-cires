data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "lambda_s3_policy" {
  statement {
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:ListBucket",
    ]
    resources = [
      aws_s3_bucket.earthquake_reports.arn,
      "${aws_s3_bucket.earthquake_reports.arn}/*"
    ]
  }
}

data "aws_iam_policy_document" "lambda_ses_policy" {
  statement {
    effect = "Allow"
    actions = [
      "ses:SendRawEmail"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "lambda_ses_policy" {
  name   = "lambda_ses_access_policy_${var.environment}"
  policy = data.aws_iam_policy_document.lambda_ses_policy.json
}

resource "aws_iam_role_policy_attachment" "lambda_ses" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_ses_policy.arn
}

resource "aws_iam_role" "lambda_execution" {
  name               = "lambda_execution_role_${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_policy" "lambda_s3_policy" {
  name   = "lambda_s3_access_policy_${var.environment}"
  policy = data.aws_iam_policy_document.lambda_s3_policy.json
}

resource "aws_iam_role_policy_attachment" "lambda_s3" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_s3_policy.arn
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "notifier" {
  function_name = "report-notifier-${var.environment}"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"

  s3_bucket = aws_s3_bucket.report_notifier_source_code.bucket
  s3_key = "report-notifier.zip"
  source_code_hash = var.source_code_hash

  environment {
    variables = {
      ENVIRONMENT = var.environment
      VERIFIED_SENDER = var.verified_sender
    }
  }

  tags = {
    Environment = var.environment
    Application = "report-notifier"
  }
}
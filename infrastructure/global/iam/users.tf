
locals {
  s3_upload_users = {
    "cires-reports-uploader" = {
      description = "User for uploading objects to CIRES report buckets"
      buckets     = ["cires-reports-stage", "cires-reports-prod"]
    }
    "rss-db-backup" = {
      description = "User for uploading objects for CAP RSS database backups"
      buckets     = ["cap-rss-pg-backups"]
    }
  }
}

resource "aws_iam_user" "s3_upload_user" {
  for_each = local.s3_upload_users

  name = each.key
  path = "/service-users/"

  tags = {
    Description = each.value.description
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
  for_each = local.s3_upload_users

  statement {
    sid    = "AllowS3Uploads"
    effect = "Allow"

    actions = [
      "s3:PutObject",
    ]

    # Dynamically generate ARNs for the specific buckets
    resources = formatlist("arn:aws:s3:::%s/*", each.value.buckets)
  }

  statement {
    sid    = "AllowBucketListing"
    effect = "Allow"

    actions = [
      "s3:ListBucket",
    ]

    resources = formatlist("arn:aws:s3:::%s", each.value.buckets)
  }
}

resource "aws_iam_policy" "s3_upload_policy" {
  for_each = local.s3_upload_users

  name        = "${each.key}-policy"
  description = "Policy allowing uploading objects to buckets for ${each.key}"
  policy      = data.aws_iam_policy_document.s3_upload_policy_doc[each.key].json
}

resource "aws_iam_user_policy_attachment" "s3_upload_policy_attachment" {
  for_each = local.s3_upload_users

  user       = aws_iam_user.s3_upload_user[each.key].name
  policy_arn = aws_iam_policy.s3_upload_policy[each.key].arn
}
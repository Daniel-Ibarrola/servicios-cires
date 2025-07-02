variable "bucket_name" {
  description = "The name of the bucket used to store reports"
  type = string
}

variable "environment" {
  description = "The name of the environment, e.g 'prod'"
  type = string
}
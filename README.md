# Servicios CIRES

This repository contains the infrastructure and services for CIRES (Centro de Investigación de Riesgos y Estudios Sísmicos), focusing on earthquake report automation and notification systems.

## Repository Purpose

The primary purpose of this repository is to provide automated infrastructure and services for processing and distributing earthquake reports. It includes:

- Infrastructure as Code (IaC) using Terraform for AWS resources
- Serverless functions for processing and notifying about new earthquake reports
- Email notification services for distributing reports to stakeholders

## Repository Structure

The repository is organized into two main directories:

### Infrastructure

Contains all Terraform code for provisioning and managing AWS resources:

- **Global Resources**: Shared infrastructure components used across environments
  - [Backend Configuration](infrastructure/global/backend/README.md): S3 and DynamoDB for Terraform state management
  - [Email Service](infrastructure/global/email/README.md): AWS SES configuration for sending notifications
  - [IAM Configuration](infrastructure/global/iam/README.md): Identity and access management for AWS services


- **Modules**: Reusable Terraform modules
  - **Services**:
    - [Report Notifier](infrastructure/modules/services/report-notifier/README.md): Lambda function and S3 bucket for report processing


- **Environment-specific Deployments**:
  - **Production**: Production environment configuration
  - **Stage**: Staging/testing environment configuration

### Services

Contains the application code for various services:

- **Report Notifier**: Service that processes earthquake reports and sends email notifications

## Service List

- **[Earthquake Report Automation](services/report-notifier/README.md)**: Automatically processes and distributes earthquake reports via email when they are uploaded to S3 buckets

# Report notifier lambda

This folder contains the report notifier lambda code. This lambda is triggered by an S3 event
notification. It expects a `.eml` object with the contents of an email. This is used by the lambda
to send an email with SES

## Build the code

```shell
npm run build
```

## E2E testing

To run E2E tests do

```shell
npm run test
```

## Infrastructure

The infrastructure for this lambda can be found in

```text
infrastructure/stage/services/report-notifier # for stage
infrastructure/prod/services/report-notifier # for prod
```
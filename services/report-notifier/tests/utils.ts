export const createTestEml = (
  from: string,
  to: string,
  uniqueId: string,
  bcc?: string,
): string => {
  let headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: E2E Test Email - ${uniqueId}`,
  ];

  if (bcc) {
    headers.push(`BCC: ${bcc}`);
  }

  headers.push("Content-Type: text/plain");

  return (
    headers.join("\n") +
    "\n\nThis is the body of the E2E test email.\nTest ID: ${uniqueId}"
  );
};

import * as azure from "azure-devops-node-api";
import assert from "node:assert";

const orgUrl = process.env.AZURE_BASE_URL;
const token = process.env.AZURE_PERSONAL_ACCESS_TOKEN;

export function createConnection() {
  assert.ok(orgUrl, "env AZURE_BASE_URL must be provided");
  assert.ok(token, "env AZURE_PERSONAL_ACCESS_TOKEN must be provided");

  const authHandler = azure.getPersonalAccessTokenHandler(token);
  const connection = new azure.WebApi(orgUrl, authHandler);
  return connection;
}

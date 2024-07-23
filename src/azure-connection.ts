import * as azure from "azure-devops-node-api";

export function createConnection(orgUrl: string, token: string) {
  const authHandler = azure.getPersonalAccessTokenHandler(token);
  const connection = new azure.WebApi(orgUrl, authHandler);
  return connection;
}

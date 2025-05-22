import type { WebApi } from "azure-devops-node-api";
import type {
  ArtifactMetadata,
  ReleaseDefinitionEnvironment,
} from "azure-devops-node-api/interfaces/ReleaseInterfaces.js";
import SimpleTable from "cli-simple-table";

export interface Options {
  connection: WebApi;
  project: string;
  releaseDefinitionId: number;
}

export async function fetchDeployedReleases({
  connection,
  project,
  releaseDefinitionId,
}: Options) {
  const releaseApi = await connection.getReleaseApi();
  const releaseDefinition = await releaseApi.getReleaseDefinition(
    project,
    releaseDefinitionId,
  );
  const environments: ReleaseDefinitionEnvironment[] | undefined =
    releaseDefinition.environments;
  printReleaseVersionTable(environments ?? []);
}

function printReleaseVersionTable(
  environments: ReleaseDefinitionEnvironment[],
) {
  const table = new SimpleTable();

  table.header("Environment", "Release");
  environments.forEach((a) =>
    table.row(
      a.name ?? "unknown",
      a.currentRelease?.id?.toString() ?? "unknown",
    ),
  );

  console.log(table.toString());
}

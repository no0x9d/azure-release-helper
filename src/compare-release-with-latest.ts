import type { WebApi } from "azure-devops-node-api";
import type {
  ArtifactVersion,
  ArtifactVersionQueryResult,
  Release,
} from "azure-devops-node-api/interfaces/ReleaseInterfaces.js";
import SimpleTable from "cli-simple-table";
import chalk from "chalk";
import assert from "node:assert";

type InternalRelease = ReturnType<typeof reduceRelease>;

export interface CompareOptions {
  connection: WebApi;
  releaseId: number;
  project: string;
}

export async function compareReleaseWithLatest({
  connection,
  releaseId,
  project,
}: CompareOptions) {
  const releaseApi = await connection.getReleaseApi();
  const release = await releaseApi
    .getRelease(project, releaseId)
    .then(reduceRelease);

  const releaseDefinition = release.releaseDefinition;
  assert.ok(
    releaseDefinition,
    `release ${releaseId}: ${release.name} does not have a release definition`,
  );

  const artifactVersions = await releaseApi.getArtifactVersions(
    project,
    releaseDefinition,
  );

  const table = new SimpleTable();

  table.header("artifact", release.name! ?? "", "new Release");
  release.artifacts?.forEach((art, index) => {
    assert.ok(art.alias);

    table.row(
      art.alias,
      art.version?.name ?? "",
      artifectIsDifferent(release, artifactVersions, art.alias)
        ? chalk.green(artifactQueryDefaultName(artifactVersions, art.alias))
        : artifactQueryDefaultName(artifactVersions, art.alias),
    );
  });

  console.log(table.toString());
}

function reduceRelease({ id, name, artifacts, releaseDefinition }: Release) {
  return {
    id,
    name,
    artifacts: artifacts?.map(({ alias, definitionReference }) => ({
      alias,
      version: definitionReference?.version,
    })),
    releaseDefinition: releaseDefinition?.id,
  };
}

function artifectIsDifferent(
  releaseA: InternalRelease,
  releaseB: ArtifactVersionQueryResult,
  alias: string,
): boolean {
  return (
    artifactName(releaseA, alias) !== artifactQueryDefaultName(releaseB, alias)
  );
}

function artifactName(release: InternalRelease, alias: string): string {
  return (
    release.artifacts?.find((a: any) => a.alias === alias)?.version?.name ?? ""
  );
}

function artifactQueryDefaultName(
  release: ArtifactVersionQueryResult,
  alias: string,
): string {
  return (
    release.artifactVersions?.find((a: ArtifactVersion) => a.alias === alias)
      ?.defaultVersion?.name ?? ""
  );
}

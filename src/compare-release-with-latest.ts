import type { WebApi } from "azure-devops-node-api";
import type {
  ArtifactVersion,
  ArtifactVersionQueryResult,
  Release,
} from "azure-devops-node-api/interfaces/ReleaseInterfaces.js";
import SimpleTable from "cli-simple-table";
import chalk from "chalk";
import assert from "node:assert";

import { Project } from "./env.js";

type InternalRelease = ReturnType<typeof reduceRelease>;

export async function compareRelease(
  connection: WebApi,
  releaseId: number,
  releaseDefinition: number,
) {
  const releaseApi = await connection.getReleaseApi();
  const releaseA = await releaseApi
    .getRelease(Project, releaseId)
    .then(reduceRelease);
  const artifactVersions = await releaseApi.getArtifactVersions(
    Project,
    releaseDefinition,
  );

  const table = new SimpleTable();

  table.header("artifact", releaseA.name! ?? "", "new Release");
  releaseA.artifacts?.forEach((art, index) => {
    assert.ok(art.alias);

    table.row(
      art.alias,
      art.version?.name ?? "",
      artifectIsDifferent(releaseA, artifactVersions, art.alias)
        ? chalk.green(artifactQueryDefaultName(artifactVersions, art.alias))
        : artifactQueryDefaultName(artifactVersions, art.alias),
    );
  });

  console.log(table.toString());
}

function reduceRelease({ id, name, artifacts }: Release) {
  return {
    id,
    name,
    artifacts: artifacts?.map(({ alias, definitionReference }) => ({
      alias,
      version: definitionReference?.version,
    })),
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

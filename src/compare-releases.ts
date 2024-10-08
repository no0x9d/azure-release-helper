import type { WebApi } from "azure-devops-node-api";
import type { Release } from "azure-devops-node-api/interfaces/ReleaseInterfaces.js";
import SimpleTable from "cli-simple-table";
import chalk from "chalk";
import assert from "node:assert";

type InternalRelease = ReturnType<typeof reduceRelease>;

export interface CompareOptions {
  connection: WebApi;
  releaseIdA: number;
  releaseIdB: number;
  project: string;
}

export async function compareReleases({
  connection,
  releaseIdA,
  releaseIdB,
  project,
}: CompareOptions) {
  const releaseApi = await connection.getReleaseApi();
  const releaseA = await releaseApi
    .getRelease(project, releaseIdA)
    .then(reduceRelease);
  const releaseB = await releaseApi
    .getRelease(project, releaseIdB)
    .then(reduceRelease);

  const table = new SimpleTable();

  table.header("artifact", releaseA.name! ?? "", releaseB.name ?? "");
  releaseA.artifacts?.forEach((art, index) => {
    assert.ok(art.alias);

    table.row(
      art.alias,
      art.version?.name ?? "",
      artifectIsDifferent(releaseA, releaseB, art.alias)
        ? chalk.green(artifactName(releaseB, art.alias))
        : artifactName(releaseB, art.alias),
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
  releaseB: InternalRelease,
  alias: string,
): boolean {
  return artifactName(releaseA, alias) !== artifactName(releaseB, alias);
}

function artifactName(release: InternalRelease, alias: string): string {
  return (
    release.artifacts?.find((a: any) => a.alias === alias)?.version?.name ?? ""
  );
}

import { checkbox, confirm } from "@inquirer/prompts";
import type { WebApi } from "azure-devops-node-api";
import type {
  ArtifactMetadata,
  ArtifactVersion,
  ArtifactVersionQueryResult,
  BuildVersion,
  Release,
  ReleaseStartMetadata,
} from "azure-devops-node-api/interfaces/ReleaseInterfaces.js";
import chalk from "chalk";
import SimpleTable from "cli-simple-table";
import { select } from "inquirer-select-pro";
import assert from "node:assert";

export interface CompareOptions {
  connection: WebApi;
  releaseDefinitionId: number;
  project: string;
  baseRelease?: number;
}

export async function createRelease({
  connection,
  releaseDefinitionId,
  project,
  baseRelease,
}: CompareOptions) {
  const releaseApi = await connection.getReleaseApi();

  // get release definition
  const releaseDefinition = await releaseApi.getReleaseDefinition(
    project,
    releaseDefinitionId,
  );

  // get list of versions and default version for release definition
  const artifactVersions = await releaseApi.getArtifactVersions(
    project,
    releaseDefinitionId,
  );

  // fill artifact metadata for new release with default version
  const artifacts: ArtifactMetadata[] =
    artifactVersions.artifactVersions?.map((av) => ({
      alias: av.alias,
      instanceReference: av.defaultVersion,
    })) ?? [];

  const baseReleaseData = baseRelease
    ? await releaseApi.getRelease(project, baseRelease)
    : undefined;

  if (baseReleaseData) {
    // find build information for base release and update artifacts
    baseReleaseData.artifacts?.forEach((a) => {
      const version = a?.definitionReference?.version;
      if (version) {
        const availableVersions = artifactVersions.artifactVersions?.find(
          (av) => av.alias === a.alias,
        );
        const foundBuild = availableVersions?.versions?.find(
          (build) => build.id === version.id,
        );
        if (a.alias && foundBuild) {
          updateArtifactVersion(artifacts, a.alias, foundBuild);
        }
      }
    });
  }

  // ask for manual environments in release
  const environments =
    releaseDefinition.environments?.map((e) => e.name!) ?? [];

  const manualEnvironments = await checkbox({
    message: "manual environments",
    choices: environments.map((e) => ({
      value: e,
      checked: true,
    })),
  });

  // ask for customized versions for artifact
  if (baseRelease) {
    printResultVersionTable(artifacts, artifactVersions, baseReleaseData);
  } else {
    printSimpleVersionTable(artifacts);
  }

  const customizeArtifacts = await select({
    message: "customize artifact",
    options: (input) => {
      return (
        artifactVersions.artifactVersions
          ?.filter((a) => !input || a.alias?.includes(input))
          .map((a) => ({
            name: a.alias,
            value: a,
          })) ?? []
      );
    },
  });

  for await (const artifact of customizeArtifacts) {
    const buildVersion = await select({
      message: `select ${artifact.alias}`,
      multiple: false,
      options: (input) =>
        artifact.versions
          ?.filter((v) => !input || v.name?.includes(input))
          .map((v) => ({
            name: v.name,
            value: v,
          })) ?? [],
    });

    if (artifact.alias && buildVersion) {
      updateArtifactVersion(artifacts, artifact.alias, buildVersion);
    }
  }

  // create release
  printResultVersionTable(artifacts, artifactVersions, baseReleaseData);

  const shouldCreate = await confirm({
    message: "Do you want to create this release?",
    default: true,
  });

  if (shouldCreate) {
    const releaseStartMetadata: ReleaseStartMetadata = {
      manualEnvironments,
      definitionId: releaseDefinitionId,
      artifacts,
    };

    const release = await releaseApi.createRelease(
      releaseStartMetadata,
      project,
    );
    console.log(`release with id ${release.id} successfully created`);
  }
}

function updateArtifactVersion(
  list: ArtifactMetadata[],
  alias: string,
  build: BuildVersion,
): void {
  list.forEach((am) => {
    if (am.alias === alias) {
      am.instanceReference = build;
    }
  });
}

function printSimpleVersionTable(artifacts: ArtifactMetadata[]) {
  const table = new SimpleTable();

  table.header("artifact", "Release");
  artifacts.forEach((a) =>
    table.row(a.alias ?? "unknown", a.instanceReference?.name ?? "unknown"),
  );

  console.log(table.toString());
}

function printResultVersionTable(
  artifacts: ArtifactMetadata[],
  defaults: ArtifactVersionQueryResult,
  baseRelease?: Release,
) {
  const table = new SimpleTable();

  table.header(
    "artifact",
    "new Release",
    "default versions",
    (baseRelease && baseRelease.name) || "",
  );
  artifacts.forEach((a) => {
    assert.ok(a.alias, "artifact must have an alias defined");

    table.row(
      a.alias ?? "unknown",
      a.instanceReference?.name ?? "unknown",
      isDifferent(a, defaults)
        ? chalk.red(artifactQueryDefaultName(defaults, a.alias))
        : artifactQueryDefaultName(defaults, a.alias),
      !baseRelease
        ? ""
        : isBaseDifferent(a, baseRelease)
          ? chalk.red(artifactName(baseRelease, a.alias))
          : artifactName(baseRelease, a.alias),
    );
  });

  console.log(table.toString());
}

function isDifferent(
  a: ArtifactMetadata,
  defaults: ArtifactVersionQueryResult,
) {
  return (
    a.instanceReference?.name !== artifactQueryDefaultName(defaults, a.alias!)
  );
}

function artifactQueryDefaultName(
  release: ArtifactVersionQueryResult,
  alias: string,
): string {
  return (
    release.artifactVersions?.find((a: ArtifactVersion) => a.alias === alias)
      ?.defaultVersion?.name ?? "unknown"
  );
}

function isBaseDifferent(a: ArtifactMetadata, base: Release) {
  return a.instanceReference?.name !== artifactName(base, a.alias!);
}

function artifactName(release: Release, alias: string): string {
  return (
    release.artifacts?.find((a) => a.alias === alias)?.definitionReference
      ?.version?.name ?? ""
  );
}

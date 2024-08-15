#!/usr/bin/env node

import assert from "node:assert";
import yargs from "yargs";
import { createConnection } from "../src/azure-connection.js";
import { compareReleaseWithLatest } from "../src/compare-release-with-latest.js";
import { compareReleases } from "../src/compare-releases.js";
import { createRelease } from "../src/create-release.js";

const rawArgs = process.argv.slice(2);

yargs(rawArgs)
  .scriptName("azrh")
  .usage("$0 <cmd> [args]")
  .option("project", {
    global: true,
    alias: "p",
    description: "azure devops project",
    default: process.env.AZURE_PROJECT,
    defaultDescription: "env AZURE_PROJECT",
    requiresArg: true,
    demandOption: true,
  })
  .option("org", {
    global: true,
    alias: "o",
    description: "https://dev.azure.com/<ORG>",
    default: process.env.AZURE_BASE_URL,
    defaultDescription: "env AZURE_BASE_URL",
    requiresArg: true,
    demandOption: true,
  })
  .option("pat", {
    global: true,
    alias: "P",
    description: "personal access token",
    default: process.env.AZURE_PERSONAL_ACCESS_TOKEN,
    defaultDescription: "env AZURE_PERSONAL_ACCESS_TOKEN",
    requiresArg: true,
    demandOption: true,
  })
  .command(
    "create",
    "create new release",
    (args) =>
      args
        .option("definition", {
          alias: "d",
          description: "release definition id",
          type: "number",
          coerce: argIsNumber,
          requiresArg: true,
          demandOption: true,
          default: Number(process.env.AZURE_RELEASE_DEFINITION) || undefined,
          defaultDescription: "env AZURE_RELEASE_DEFINITION",
        })
        .option("base", {
          alias: "b",
          description: "base release",
          type: "number",
          coerce: argIsNumber,
          requiresArg: true,
        }),
    async ({ org, pat, project, definition, base }) => {
      const connection = createConnection(org, pat);
      createRelease({
        connection,
        project,
        releaseDefinitionId: definition,
        baseRelease: base,
      });
    },
  )
  .command(
    ["compare <release1> [release2]"],
    "compare two releases",
    (args) =>
      args
        .positional("release1", {
          description: "id of the release",
          type: "number",
          demandOption: true,
        })
        .positional("release2", {
          description: "id of the release",
          defaultDescription: "latest version",
          type: "number",
        }),
    ({ org, pat, project, release1, release2 }) => {
      const connection = createConnection(org, pat);
      if (release2) {
        compareReleases({
          connection,
          project: project,
          releaseIdA: release1,
          releaseIdB: release2,
        });
      } else {
        compareReleaseWithLatest({
          connection,
          releaseId: release1,
          project: project,
        });
      }
    },
  )
  .demandCommand()
  .help()
  .parse();

function argIsNumber(value: number | string): number {
  if (typeof value === "number" && !isNaN(value)) {
    return value;
  }
  throw new Error("release definition must be a number");
}

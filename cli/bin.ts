#!/usr/bin/env node

import yargs from "yargs";
import { createConnection } from "../src/azure-connection.js";
import { compareReleaseWithLatest } from "../src/compare-release-with-latest.js";
import { compareReleases } from "../src/compare-releases.js";

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

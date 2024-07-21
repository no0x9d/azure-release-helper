import assert from "node:assert";

const project = process.env.AZURE_PROJECT;
assert.ok(project, "env AZURE_PROJECT must be provided");

export const Project = project;

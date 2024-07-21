import { createConnection } from "./src/azure-connection.js";
import { compareReleases } from "./src/compare-releases.js";
import { compareRelease } from "./src/compare-release-with-latest.js";

const connection = createConnection();

let connData = await connection.connect();
// @ts-ignore
// console.log(`Hello ${connData.authenticatedUser.providerDisplayName}`);
// console.log(connData);
// fetchVersions(connection);

// compareReleases(connection, 2011, 2005);
compareRelease(connection, 2027, 12);

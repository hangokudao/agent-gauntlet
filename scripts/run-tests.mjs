import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const testDir = path.resolve("dist", "test");
const testFiles = (await readdir(testDir))
  .filter((file) => file.endsWith(".test.js"))
  .sort()
  .map((file) => path.join(testDir, file));

if (!testFiles.length) {
  throw new Error(`No compiled tests found in ${testDir}.`);
}

const result = spawnSync(process.execPath, ["--test", ...testFiles], { stdio: "inherit" });
if (result.error) {
  throw result.error;
}
process.exitCode = result.status ?? 1;

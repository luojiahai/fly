import { execFileSync } from "node:child_process";

const branch =
  process.env.WORKERS_CI_BRANCH ?? execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
const production = branch === "main";

console.log(production ? "Deploying to production." : `Branch "${branch || "detached HEAD"}" is not main, so this uploads a preview only.`);
execFileSync("wrangler", [production ? "deploy" : "preview"], { stdio: "inherit" });

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const url = process.argv[2] ?? "http://127.0.0.1:3010/";
const name = process.argv[3] ?? "home-mobile";
if (!/^[a-z0-9-]+$/.test(name)) throw new Error("Geçersiz rapor adı.");
mkdirSync(".lighthouse", { recursive: true });
const output = resolve(".lighthouse", `${name}.json`);
const cli = resolve("node_modules/lighthouse/cli/index.js");
const result = spawnSync(process.execPath, [
  cli, url, "--output=json", `--output-path=${output}`, "--only-categories=performance,accessibility,best-practices,seo",
  "--chrome-flags=--headless=new --disable-extensions --no-first-run", "--quiet",
], { stdio: "inherit" });
if (result.error || result.status !== 0) throw result.error ?? new Error("Lighthouse tamamlanamadı.");
const report = JSON.parse(readFileSync(output, "utf8"));
for (const { title, score } of Object.values(report.categories)) console.log(`${title}: ${Math.round(score * 100)}`);
console.log(output);

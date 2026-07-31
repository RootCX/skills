import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}

const [pkg, claudePlugin, claudeMarketplace, codexPlugin, codexMcp, skill] =
  await Promise.all([
    readJson("package.json"),
    readJson(".claude-plugin/plugin.json"),
    readJson(".claude-plugin/marketplace.json"),
    readJson(".codex-plugin/plugin.json"),
    readJson(".mcp.json"),
    readFile(resolve(root, "skills/rootcx/SKILL.md"), "utf8"),
  ]);

assert.equal(claudePlugin.name, "rootcx");
assert.equal(claudePlugin.version, pkg.version);
assert.equal(codexPlugin.version, pkg.version);
assert.match(skill, new RegExp(`^  version: ${pkg.version.replaceAll(".", "\\.")}$`, "m"));

assert.equal(claudeMarketplace.name, "rootcx");
assert.ok(
  claudeMarketplace.plugins.some(
    ({ name, source }) => name === "rootcx" && source === "./",
  ),
  "Claude marketplace must expose the RootCX plugin from the repository root",
);

const claudeRootcx = claudePlugin.mcpServers?.rootcx;
assert.equal(
  claudeRootcx?.type,
  "http",
  "Claude must declare the remote MCP directly in plugin.json",
);
assert.equal(claudeRootcx.url, "https://rootcx.com/mcp");
assert.equal(
  claudePlugin.mcpServers?.mcpServers,
  undefined,
  "Claude plugin MCP declarations must not use the project-level mcpServers wrapper",
);

assert.equal(codexPlugin.mcpServers, "./.mcp.json");
assert.equal(codexMcp.mcpServers?.rootcx?.type, "http");
assert.equal(codexMcp.mcpServers.rootcx.url, claudeRootcx.url);
assert.ok(
  pkg.files.includes(".claude-plugin"),
  "The npm package must include the Claude plugin manifest",
);

console.log("RootCX plugin manifests are consistent across Claude and Codex.");

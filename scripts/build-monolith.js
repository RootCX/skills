#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const rulesDir = join(root, "skills", "rootcx", "rules");
const distDir = join(root, "dist");

const RULE_ORDER = [
  "manifest.md",
  "sdk-hooks.md",
  "ui.md",
  "ui-components.md",
  "backend-worker.md",
  "rest-api.md",
  "rest-api-collections.md",
  "rest-api-integrations.md",
  "rest-api-jobs.md",
  "agent.md",
];

const sections = RULE_ORDER.map((file) =>
  readFileSync(join(rulesDir, file), "utf-8").trim()
);

const monolith = sections.join("\n\n---\n\n");

mkdirSync(distDir, { recursive: true });
writeFileSync(join(distDir, "rootcx-sdk.md"), monolith + "\n");

const lines = monolith.split("\n").length;
console.log(`Built dist/rootcx-sdk.md (${lines} lines, ${RULE_ORDER.length} rules)`);

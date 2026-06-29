/**
 * Copy only the web deck files into public/ for static deploy (Cloudflare, etc.).
 * Excludes node_modules, pptx pipeline, and other repo clutter.
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "public");

const files = ["index.html"];
const dirs = ["css", "js", "assets"];

if (fs.existsSync(out)) fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const file of files) {
  fs.cpSync(path.join(root, file), path.join(out, file));
}
for (const dir of dirs) {
  const src = path.join(root, dir);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(out, dir), { recursive: true });
}

console.log("Static deck built → public/");

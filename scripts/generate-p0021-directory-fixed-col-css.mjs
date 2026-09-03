#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productRoot = path.resolve(__dirname, "..");
const hubCss = path.resolve(productRoot, "..", "..", "packages", "hub-ui", "src", "lib", "directory-fixed-column-css.mjs");
const { generateDirectoryFixedColumnCss } = await import(pathToFileURL(hubCss).href);
const { P0021_DIRECTORY_FIXED_COLUMNS, P0021_DIRECTORY_FIXED_TABLE_ROOTS } = await import(
  pathToFileURL(path.join(__dirname, "p0021-directory-fixed-columns.mjs")).href
);

const out = path.join(productRoot, "app", "src", "styles", "p0021-directory-fixed-cols.generated.css");
const css = generateDirectoryFixedColumnCss({
  entries: P0021_DIRECTORY_FIXED_COLUMNS,
  tableRoots: P0021_DIRECTORY_FIXED_TABLE_ROOTS,
  banner: "/* AUTO-GENERATED — P0021 generate-p0021-directory-fixed-col-css.mjs */",
});
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, css);
console.log(`wrote ${path.relative(productRoot, out)}`);

import fs from "node:fs";
import path from "node:path";

const targetFile = path.resolve(
  process.cwd(),
  "node_modules/@opennextjs/cloudflare/dist/cli/build/patches/plugins/load-manifest.js"
);

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, "utf-8");
  let modified = false;

  // 1. Add preview-props to the glob search
  if (content.includes("prefetch-hints}.json") && !content.includes("preview-props}.json")) {
    content = content.replace(
      "**/{*-manifest,required-server-files,prefetch-hints}.json",
      "**/{*-manifest,required-server-files,prefetch-hints,preview-props}.json"
    );
    modified = true;
  }

  // 2. Add preview-props to the fallback optional manifests
  if (content.includes('p.endsWith("prefetch-hints")) {') && !content.includes('p.endsWith("preview-props")) {')) {
    content = content.replace(
      'p.endsWith("prefetch-hints")) {',
      'p.endsWith("prefetch-hints") ||\n        p.endsWith("preview-props")) {'
    );
    modified = true;
  }

  // 3. Gracefully return {} instead of crashing the worker on unexpected loadManifest calls
  const targetLoadError = "throw new Error(\\`Unexpected loadManifest(\\${$PATH}) call!\\`);";
  if (content.includes(targetLoadError)) {
    content = content.replace(
      targetLoadError,
      "console.warn(\\`[opennext] Missing manifest: \\${$PATH}\\`); return {};"
    );
    modified = true;
  }

  // 4. Gracefully return empty RSC manifest instead of crashing on unexpected evalManifest calls
  const targetEvalError = "throw new Error(\\`Unexpected evalManifest(\\${$PATH}) call!\\`);";
  if (content.includes(targetEvalError)) {
    content = content.replace(
      targetEvalError,
      "console.warn(\\`[opennext] Missing eval manifest: \\${$PATH}\\`); return { __RSC_MANIFEST: {} };"
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(targetFile, content, "utf-8");
    console.log("[patch-opennext] Successfully patched load-manifest.js.");
  } else {
    console.log("[patch-opennext] load-manifest.js is already patched or up-to-date.");
  }
} else {
  console.warn("[patch-opennext] Target file not found:", targetFile);
}

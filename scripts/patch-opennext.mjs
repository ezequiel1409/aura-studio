import fs from "node:fs";
import path from "node:path";

// 1. Patch load-manifest.js for Next.js 16 manifest compatibility
const loadManifestFile = path.resolve(
  process.cwd(),
  "node_modules/@opennextjs/cloudflare/dist/cli/build/patches/plugins/load-manifest.js"
);

if (fs.existsSync(loadManifestFile)) {
  let content = fs.readFileSync(loadManifestFile, "utf-8");
  let modified = false;

  // Add preview-props to the glob search
  if (content.includes("prefetch-hints}.json") && !content.includes("preview-props}.json")) {
    content = content.replace(
      "**/{*-manifest,required-server-files,prefetch-hints}.json",
      "**/{*-manifest,required-server-files,prefetch-hints,preview-props}.json"
    );
    modified = true;
  }

  // Add preview-props to the fallback optional manifests
  if (content.includes('p.endsWith("prefetch-hints")) {') && !content.includes('p.endsWith("preview-props")) {')) {
    content = content.replace(
      'p.endsWith("prefetch-hints")) {',
      'p.endsWith("prefetch-hints") ||\n        p.endsWith("preview-props")) {'
    );
    modified = true;
  }

  // Gracefully return {} instead of crashing the worker on unexpected loadManifest calls
  const targetLoadError = "throw new Error(\\`Unexpected loadManifest(\\${$PATH}) call!\\`);";
  if (content.includes(targetLoadError)) {
    content = content.replace(
      targetLoadError,
      "console.warn(\\`[opennext] Missing manifest: \\${$PATH}\\`); return {};"
    );
    modified = true;
  }

  // Gracefully return empty RSC manifest instead of crashing on unexpected evalManifest calls
  const targetEvalError = "throw new Error(\\`Unexpected evalManifest(\\${$PATH}) call!\\`);";
  if (content.includes(targetEvalError)) {
    content = content.replace(
      targetEvalError,
      "console.warn(\\`[opennext] Missing eval manifest: \\${$PATH}\\`); return { __RSC_MANIFEST: {} };"
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(loadManifestFile, content, "utf-8");
    console.log("[patch-opennext] Successfully patched load-manifest.js.");
  } else {
    console.log("[patch-opennext] load-manifest.js is already patched or up-to-date.");
  }
} else {
  console.warn("[patch-opennext] loadManifestFile not found:", loadManifestFile);
}

// 2. Patch copyTracedFiles.js for Windows symlink permission fallback (EPERM)
const copyTracedFile = path.resolve(
  process.cwd(),
  "node_modules/@opennextjs/aws/dist/build/copyTracedFiles.js"
);

if (fs.existsSync(copyTracedFile)) {
  let content = fs.readFileSync(copyTracedFile, "utf-8");
  const targetSymlinkCatch = `            try {
                symlinkSync(symlink, to);
            }
            catch (e) {
                if (e.code !== "EEXIST") {
                    throw e;
                }
            }`;

  const replacementSymlinkCatch = `            try {
                symlinkSync(symlink, to);
            }
            catch (e) {
                if (e.code === "EPERM") {
                    try {
                        cpSync(from, to, { recursive: true });
                    } catch {}
                } else if (e.code !== "EEXIST") {
                    throw e;
                }
            }`;

  if (content.includes(targetSymlinkCatch)) {
    content = content.replace(targetSymlinkCatch, replacementSymlinkCatch);
    fs.writeFileSync(copyTracedFile, content, "utf-8");
    console.log("[patch-opennext] Successfully patched copyTracedFiles.js for Windows symlink fallback.");
  } else {
    console.log("[patch-opennext] copyTracedFiles.js is already patched or up-to-date.");
  }
}

// Metro config for the monorepo layout: /mobile is a sibling of /core and
// /data, not their parent. Metro's Windows file crawler (no Watchman
// installed in this environment) failed to register files from `core`/
// `data` when they were only reachable via `watchFolders` pointing outside
// `projectRoot` ("Failed to get the SHA-1 for ..." even though the files
// exist and are unambiguously listed in `watchFolders`) — a known rough
// edge for Metro + Windows + folders outside the project root. The robust
// workaround: directory junctions (`_core`, `_data`, created via
// `mklink /J`) that put the real /core and /data content *inside*
// /mobile's own project root, so Metro's default single-root crawl covers
// them with no special-casing. `git status` in the monorepo root should
// show `_core`/`_data` as untracked — they're local filesystem plumbing,
// not real duplicated files.
//
// "@core/*" / "@data/*" still resolve to the same underlying source /core
// and /web already use — only the on-disk path Metro walks to get there
// changed.
const { getDefaultConfig } = require("expo/metro-config");
const fs = require("fs");
const path = require("path");

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

const ALIASES = {
  "@core": path.resolve(projectRoot, "_core/src"),
  "@data": path.resolve(projectRoot, "_data"),
};
config.resolver.extraNodeModules = ALIASES;

/**
 * /core's source (and this app's own files) use explicit ".js" extensions
 * on relative imports (TS's NodeNext-style convention, e.g. "./types.js"
 * resolving to "./types.ts") because that's what TS's "Bundler"
 * moduleResolution and Vite both resolve correctly without any config.
 * Metro doesn't do that ".js" -> ".ts"/".tsx" translation on its own, so
 * this resolves such specifiers against the filesystem directly.
 */
const SOURCE_EXTENSIONS = ["ts", "tsx", "js", "jsx", "json"];

function resolveAliasedFile(baseDir, subpath) {
  const withoutJsExtension = subpath.endsWith(".js") ? subpath.slice(0, -3) : subpath;
  const withoutAnyExtension = withoutJsExtension.replace(/\.(ts|tsx|jsx?|json)$/, "");
  for (const ext of SOURCE_EXTENSIONS) {
    const candidate = path.join(baseDir, `${withoutAnyExtension}.${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  for (const [alias, baseDir] of Object.entries(ALIASES)) {
    if (moduleName === alias || moduleName.startsWith(`${alias}/`)) {
      const subpath = moduleName === alias ? "index" : moduleName.slice(alias.length + 1);
      const filePath = resolveAliasedFile(baseDir, subpath);
      if (filePath) {
        return { type: "sourceFile", filePath };
      }
    }
  }

  // Plain relative ".js" imports (used throughout /core and this app's own
  // files) — Metro treats an explicit extension as authoritative and won't
  // try ".ts"/".tsx" on its own the way it does for extensionless imports.
  if (moduleName.startsWith(".") && moduleName.endsWith(".js")) {
    const originDir = path.dirname(context.originModulePath);
    const filePath = resolveAliasedFile(originDir, moduleName);
    if (filePath) {
      return { type: "sourceFile", filePath };
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

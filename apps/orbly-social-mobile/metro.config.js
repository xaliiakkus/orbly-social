const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// LiveKit postinstall geçici klasörleri Metro'yu çökertmesin (Windows)
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : config.resolver.blockList
      ? [config.resolver.blockList]
      : []),
  /react-native-webrtc_tmp_/,
];

// Tek React / React Query kopyası — monorepo'da çift paket context hatasını önler
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, "node_modules/react"),
  "react-dom": path.resolve(projectRoot, "node_modules/react-dom"),
  "@tanstack/react-query": path.resolve(
    projectRoot,
    "node_modules/@tanstack/react-query",
  ),
  "@tanstack/query-core": path.resolve(
    projectRoot,
    "node_modules/@tanstack/query-core",
  ),
};

const splashShim = path.resolve(projectRoot, "lib/expo-router-splash.ts");
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "../utils/splash" &&
    context.originModulePath?.includes("expo-router")
  ) {
    return { type: "sourceFile", filePath: splashShim };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

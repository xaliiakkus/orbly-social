const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;

const orblyPackages = {
  "@orbly/types": path.join(projectRoot, "packages/types/src"),
  "@orbly/api-client": path.join(projectRoot, "packages/api-client/src"),
  "@orbly/features": path.join(projectRoot, "packages/features/src"),
};

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// LiveKit postinstall geçici klasörleri Metro'yu çökertmesin (Windows)
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : config.resolver.blockList
      ? [config.resolver.blockList]
      : []),
  /react-native-webrtc_tmp_/,
];

config.resolver.extraNodeModules = {
  ...orblyPackages,
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

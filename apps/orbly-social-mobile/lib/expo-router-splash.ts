/**
 * expo-router/build/utils/splash yerine — Expo Go / HMR'de native splash hatalarını yutar.
 * metro.config.js bu dosyaya yönlendirir.
 */
import { isRunningInExpoGo } from "expo";
import * as ExpoSplashScreen from "expo-splash-screen";

function nativeSplashEnabled() {
  return !isRunningInExpoGo();
}

async function swallow<T>(fn: () => Promise<T>): Promise<T | false> {
  try {
    return await fn();
  } catch {
    return false;
  }
}

export function hide() {
  if (!nativeSplashEnabled()) return;
  void swallow(() => Promise.resolve(ExpoSplashScreen.hide()));
}

export async function hideAsync() {
  if (!nativeSplashEnabled()) return false;
  return swallow(() => ExpoSplashScreen.hideAsync());
}

export async function preventAutoHideAsync() {
  if (!nativeSplashEnabled()) return false;
  return swallow(() => ExpoSplashScreen.preventAutoHideAsync());
}

export async function _internal_preventAutoHideAsync() {
  if (!nativeSplashEnabled()) return false;
  const internal = (
    ExpoSplashScreen as typeof ExpoSplashScreen & {
      _internal_preventAutoHideAsync?: () => Promise<boolean>;
    }
  )._internal_preventAutoHideAsync;
  if (!internal) return false;
  return swallow(() => internal.call(ExpoSplashScreen));
}

export async function _internal_maybeHideAsync() {
  if (!nativeSplashEnabled()) return false;
  const internal = (
    ExpoSplashScreen as typeof ExpoSplashScreen & {
      _internal_maybeHideAsync?: () => Promise<boolean>;
    }
  )._internal_maybeHideAsync;
  if (!internal) return false;
  return swallow(() => internal.call(ExpoSplashScreen));
}

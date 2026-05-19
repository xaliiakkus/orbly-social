import { isRunningInExpoGo } from "expo";

import { hideAsync, preventAutoHideAsync } from "@/lib/expo-router-splash";

type SplashGlobals = typeof globalThis & {
  __orblySplashPrevented?: boolean;
  __orblySplashHidden?: boolean;
};

const g = globalThis as SplashGlobals;

/** Expo Go kendi splash'ını kullanır; native prevent/hide burada hata verir. */
function nativeSplashEnabled() {
  return !isRunningInExpoGo();
}

export function preventSplashAutoHide() {
  if (!nativeSplashEnabled() || g.__orblySplashPrevented) return;
  g.__orblySplashPrevented = true;
  void preventAutoHideAsync();
}

export function hideSplashOnce() {
  if (!nativeSplashEnabled() || g.__orblySplashHidden) return;
  g.__orblySplashHidden = true;
  void hideAsync();
}

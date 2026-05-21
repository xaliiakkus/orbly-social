import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const MIGRATED_FLAG = "orbly-persist-migrated-from-secure-store";

const LEGACY_PERSIST_KEYS = ["orbly-auth-mobile", "orbly-device-accounts-mobile"];

/** Eski SecureStore persist → AsyncStorage (tek sefer). */
export async function migratePersistFromSecureStore(): Promise<void> {
  if ((await AsyncStorage.getItem(MIGRATED_FLAG)) === "1") return;

  for (const key of LEGACY_PERSIST_KEYS) {
    try {
      const legacy = await SecureStore.getItemAsync(key);
      if (!legacy) continue;
      const existing = await AsyncStorage.getItem(key);
      if (!existing) await AsyncStorage.setItem(key, legacy);
      await SecureStore.deleteItemAsync(key);
    } catch {
      /* SecureStore okunamadı — yeni kurulum */
    }
  }

  await AsyncStorage.setItem(MIGRATED_FLAG, "1");
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StateStorage } from "zustand/middleware";

/**
 * Zustand persist — SecureStore 2048 bayt sınırını aşan JSON için AsyncStorage.
 * (JWT + çoklu hesap kaydı tek parça JSON'da 2KB+ olabiliyor.)
 */
export const zustandPersistStorage: StateStorage = {
  getItem: (name) => AsyncStorage.getItem(name),
  setItem: (name, value) => AsyncStorage.setItem(name, value),
  removeItem: (name) => AsyncStorage.removeItem(name),
};

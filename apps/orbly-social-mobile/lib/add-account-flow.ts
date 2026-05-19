import * as SecureStore from "expo-secure-store";

const RETURN_USER_KEY = "orbly-add-account-return-user-id";
const ADD_FLAG_KEY = "orbly-add-account";

export async function stashReturnUserId(userId: string) {
  await SecureStore.setItemAsync(RETURN_USER_KEY, userId);
  await SecureStore.setItemAsync(ADD_FLAG_KEY, "1");
}

export async function clearAddAccountFlow() {
  await SecureStore.deleteItemAsync(RETURN_USER_KEY);
  await SecureStore.deleteItemAsync(ADD_FLAG_KEY);
}

export async function getReturnUserId() {
  return SecureStore.getItemAsync(RETURN_USER_KEY);
}

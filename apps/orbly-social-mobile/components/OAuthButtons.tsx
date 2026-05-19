import { useOAuthLogin } from "@orbly/features";
import type { AuthResponse } from "@orbly/types";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text } from "react-native";

import { OrblyColors } from "@/constants/Colors";

WebBrowser.maybeCompleteAuthSession();

type GoogleOAuthConfig = {
  webClientId: string;
  iosClientId: string;
  androidClientId: string;
};

/** Platform için gerekli Google client ID'ler tanımlı mı? */
function getGoogleOAuthConfig(): GoogleOAuthConfig | null {
  const web = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() || "";
  const ios = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || "";
  const android = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || "";

  if (Platform.OS === "ios") {
    if (!ios) return null;
    return {
      webClientId: web || ios,
      iosClientId: ios,
      androidClientId: android || web || ios,
    };
  }

  if (Platform.OS === "android") {
    const androidClientId = android || web;
    if (!androidClientId) return null;
    return {
      webClientId: web || androidClientId,
      iosClientId: ios || web || androidClientId,
      androidClientId,
    };
  }

  if (!web) return null;
  return {
    webClientId: web,
    iosClientId: ios || web,
    androidClientId: android || web,
  };
}

/** Hook yalnızca client ID'ler varken mount edilir — boş iosClientId crash'ini önler */
function GoogleSignInButton({
  config,
  onSuccess,
}: {
  config: GoogleOAuthConfig;
  onSuccess: (res: AuthResponse) => void;
}) {
  const oauth = useOAuthLogin();
  const [request, response, promptGoogle] = Google.useAuthRequest({
    webClientId: config.webClientId,
    iosClientId: config.iosClientId,
    androidClientId: config.androidClientId,
  });

  useEffect(() => {
    if (response?.type !== "success") return;
    const idToken = response.authentication?.idToken;
    if (!idToken) return;
    oauth.mutate({ provider: "google", idToken }, { onSuccess });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onSuccess stable from parent
  }, [response]);

  return (
    <Pressable
      style={[styles.btn, styles.oauthBtn]}
      onPress={() => void promptGoogle()}
      disabled={!request || oauth.isPending}
    >
      {oauth.isPending ? (
        <ActivityIndicator color={OrblyColors.textPrimary} />
      ) : (
        <Text style={styles.oauthText}>Google ile devam et</Text>
      )}
    </Pressable>
  );
}

export function OAuthButtons({
  onSuccess,
}: {
  onSuccess: (res: AuthResponse) => void;
}) {
  const googleConfig = getGoogleOAuthConfig();
  const oauth = useOAuthLogin();
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    void AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  const signInApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) return;
      const name = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName]
            .filter(Boolean)
            .join(" ")
        : undefined;
      oauth.mutate(
        {
          provider: "apple",
          idToken: credential.identityToken,
          email: credential.email ?? undefined,
          displayName: name,
          oauthId: credential.user,
        },
        { onSuccess },
      );
    } catch {
      /* kullanıcı iptal etti */
    }
  };

  const showDivider = googleConfig || (Platform.OS === "ios" && appleAvailable);

  return (
    <>
      {showDivider && (
        <Text style={styles.divider}>veya</Text>
      )}
      {googleConfig ? (
        <GoogleSignInButton config={googleConfig} onSuccess={onSuccess} />
      ) : null}
      {Platform.OS === "ios" && appleAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
          cornerRadius={999}
          style={styles.appleBtn}
          onPress={() => void signInApple()}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  divider: {
    color: OrblyColors.textSecondary,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 4,
    fontSize: 14,
  },
  btn: {
    borderRadius: 999,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },
  oauthBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: OrblyColors.border,
  },
  oauthText: { color: OrblyColors.textPrimary, fontWeight: "700", fontSize: 15 },
  appleBtn: { width: "100%", height: 48, marginTop: 12 },
});

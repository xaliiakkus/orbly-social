# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

## Canlı yayın (LiveKit)

- Native oda `@livekit/react-native` kullanır; **Expo Go çalışmaz** (fallback: web).
- LiveKit yalnızca `/live/[id]` açılınca **dynamic import** ile yüklenir (ana bundle’ı bozmaz).
- İlk kurulum: `yarn --cwd apps/orbly-social-mobile prebuild` sonra `ios` veya `android`.
- Metro çökerse: `npx expo start -c` (cache temizle). `metro.config.js` webrtc geçici klasörlerini ignore eder.
- Android emulator/cihaz için `ANDROID_HOME` ve SDK kurulu olmalı (`adb` PATH’te).

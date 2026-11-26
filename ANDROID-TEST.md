# Neliel Android (experimental)
This branch builds a native ARM64 debug APK independently of Cloudflare. The frontend is bundled locally and Tauri's native HTTP plugin handles the configured remote AI provider. No API credentials are embedded. The APK uses a separate application ID; web IndexedDB and localStorage do not migrate automatically. Configure your provider and import a VRM inside the app. Download the artifact named Neliel-Android-ARM64 from a successful Android APK workflow run. Extract the ZIP and install the signed debug APK on an Android device. The debug signing key on a hosted runner may change between builds; back up local data before uninstalling to replace it. Desktop overlay, global hotkeys and upstream updater are intentionally disabled. Test text chat with a HTTPS endpoint first, then VRM import, wardrobe controls, voice and microphone. Voice and provider discovery may need additional Android-specific work; this first build is experimental. Do not enter API keys in GitHub or build logs.

## Local build
Requires Node 22, pnpm, Rust >=1.90, Android SDK/NDK and Java. Run:
```sh
pnpm install --frozen-lockfile
pnpm exec tauri android init --ci --config src-tauri/tauri.android.conf.json
pnpm exec tauri android build --ci --debug --apk --target aarch64 --config src-tauri/tauri.android.conf.json
```

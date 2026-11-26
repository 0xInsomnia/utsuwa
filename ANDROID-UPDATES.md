# Neliel Android: permanent signing and updates

Configure repository Actions secret `NELIEL_SIGNING_BUNDLE` exactly once. Its value is a private JSON object with `keystore` (base64 PKCS12 file) and `password` (keystore and key password); alias `neliel`. Keep an encrypted backup outside GitHub. Never commit the secret, APK signing key or password. Do not expose them in logs. The key must remain the same for every update.

Each push on feature/android-apk builds an ARM64 APK. Without the secret, only a debug artifact is generated; with the secret, the workflow signs with the permanent key, verifies versionCode and signature, and publishes a direct APK asset in a unique prerelease named neliel-android-<code>. Codes increase with GitHub workflow run number. No Cloudflare backend is required.

The first permanently signed APK normally cannot replace a debug-signed APK. Back up character and conversation data (Settings > Data), keep original VRMs and API credentials separately, and verify the backup before uninstalling the debug app. Never uninstall a permanently signed installation to update it; install the next APK over it. Android validates the signing certificate and version and requires installation approval. The update UI checks public GitHub releases and opens the exact APK link in the system browser; Android handles downloading and installation. This does not install silently.

To create your own private signing bundle locally with a Java JDK:
```sh
keytool -genkeypair -storetype PKCS12 -keystore neliel.p12 -alias neliel -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=Neliel Android'
```
Use a strong password. Convert the keystore to base64 and create the JSON with that password locally; add the complete JSON to the repository secret. Never share it in chat or commit it. The debug test app has separate local data from the web app.

# Play Store Release Guide

## 1. Create a release keystore

```bash
keytool -genkey -v -keystore android/release.keystore -alias cityhelper -keyalg RSA -keysize 2048 -validity 10000
```

Store the keystore and passwords securely. You'll need them for every update.

## 2. Configure signing

Copy `android/keystore.properties.example` to `android/keystore.properties` and fill in:

```
storeFile=release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=cityhelper
keyPassword=YOUR_KEY_PASSWORD
```

Add to `.gitignore`:
```
android/keystore.properties
android/*.keystore
android/*.jks
```

## 3. Build release APK/AAB

```bash
npm run build
npx cap sync android
cd android && ./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

For APK (alternative):
```bash
./gradlew assembleRelease
```

## 4. Play Console setup

1. Create a [Google Play Developer](https://play.google.com/console) account ($25 one-time)
2. Create a new app
3. Complete store listing (screenshots, description, privacy policy)
4. Upload the AAB in Production → Create new release
5. Complete content rating questionnaire
6. Set up pricing (free/paid)

## 5. App signing (Play App Signing)

Google recommends enrolling in Play App Signing. When you upload your first AAB, you can opt in. Google will hold the app signing key; you keep the upload key (your release.keystore).

# Trackly mobile

The first mobile app milestone: navigation, Trackly's theme and Polish and English
translations. This preview does not connect to the backend. Sign-in, payment entry,
chat and reminders are not implemented yet.

## Features

- Overview, chat preview and settings tabs.
- Device language detection, with a saved Polish or English override.
- Bundled Manrope and Source Sans 3 fonts.
- Scrollable layouts, safe areas and accessible language controls.

## Run locally

Use Node 24. From this directory:

```bash
npm ci
```

```bash
npm start
```

Connect the phone to the same Wi-Fi as your Mac, scan the terminal's QR code (with
the Expo Go app on Android, with Camera on iPhone) and allow local network access when
asked. Keep the terminal running. No environment variables or backend are needed.

This milestone uses Expo SDK 57, so it needs Expo Go for SDK 57. On Android, install it
from Google Play or pick SDK 57 at [expo.dev/go](https://expo.dev/go). On iPhone, Expo Go
from the App Store only runs SDK 54 projects; for SDK 57 build your own Expo Go with
`eas go` and install it through TestFlight, which needs an Apple Developer account.
Verified on 6 October 2026 against
[Expo's compatibility guide](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/).
A development build will replace Expo Go when native sign-in arrives.

For a local browser preview:

```bash
npm run web
```

The browser preview is for checking the layout and navigation; it is not a released
web application and does not replace testing on a phone.

Check all three tabs, switch languages in Settings, reload to check the saved choice,
then switch back to the device language. Also check larger system text on the phone.
Chat's example and input are a preview, with no sending or saving.

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npm test
```

```bash
npm run build
```

The build command exports JavaScript and assets for iOS, Android and the browser
into the ignored `dist/` directory. It does not produce a signed IPA or APK.
CI runs these checks for pull requests.

## Data and credits

Only the language preference is stored on the device. This milestone makes no
application API calls and uses no analytics or model provider. Expo Go's development
tools have their own behaviour.

The logo and icon are reused from the existing Trackly site and extension. The icon
is a preview asset; store artwork and app identifiers will be prepared before release.
Manrope and Source Sans 3 are distributed through Expo Google Fonts under the SIL
Open Font License. Feather icons come from `@expo/vector-icons`.

The dependency baseline and TypeScript/ESLint setup started from Expo's SDK 54 default
template (`expo-template-default` 54.0.63), trimmed for this app, and were moved to SDK 57
with `npx expo install expo@^57.0.0 --fix`. Screens, theme, translations, language storage
and tests are project code. npm generates the lockfile.

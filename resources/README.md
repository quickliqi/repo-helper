# Android App Assets

## Required Assets for Professional App

### App Icon
Create these icon sizes in `resources/android/icon/`:

| Size | Folder | Filename |
|------|--------|----------|
| 48x48 | drawable-mdpi | ic_launcher.png |
| 72x72 | drawable-hdpi | ic_launcher.png |
| 96x96 | drawable-xhdpi | ic_launcher.png |
| 144x144 | drawable-xxhdpi | ic_launcher.png |
| 192x192 | drawable-xxxhdpi | ic_launcher.png |

### Splash Screen
Create these splash images in `resources/android/splash/`:

| Size | Folder | Filename |
|------|--------|----------|
| 480x800 | drawable-mdpi | splash.png |
| 720x1280 | drawable-hdpi | splash.png |
| 960x1600 | drawable-xhdpi | splash.png |
| 1280x1920 | drawable-xxhdpi | splash.png |
| 1920x2560 | drawable-xxxhdpi | splash.png |

## Quick Setup with @capacitor/assets

Run these commands after cloning the project:

```bash
npm install -g @capacitor/assets
npx capacitor-assets generate --android
```

This will auto-generate all required sizes from a source icon and splash.

## Manual Setup

1. Place your `icon.png` (1024x1024) in `resources/`
2. Place your `splash.png` (2732x2732) in `resources/`
3. Run: `npx capacitor-assets generate --android`

## Brand Colors

- Primary Background: #0F172A (Dark slate)
- Primary Color: Use your brand accent color
- App Name: RealQuickLiqi

## After Generating Assets

Run these commands to apply changes:

```bash
npx cap sync android
npx cap run android
```

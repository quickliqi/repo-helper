import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c035772912944f42b85217b8a3f315b3',
  appName: 'RealQuickLiqi',
  webDir: 'dist',
  server: {
    url: 'https://c0357729-1294-4f42-b852-17b8a3f315b3.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#0F172A',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  },
  android: {
    backgroundColor: '#0F172A',
    allowMixedContent: true
  }
};

export default config;

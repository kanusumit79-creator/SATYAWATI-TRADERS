import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.satyawati.traders',
  appName: 'सत्यवती ट्रेडर्स',
  webDir: 'dist',
  backgroundColor: '#FAF7F2',
  android: {
    allowMixedContent: true,
  },
};

export default config;

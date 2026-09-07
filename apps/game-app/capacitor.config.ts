import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.candygame',
  appName: 'Candy Kingdom',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};

export default config;

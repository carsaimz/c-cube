import type { CapacitorConfig } from "@capacitor/cli";

/** C-Cube — configuração Capacitor (Android). WebDir = exportação estática do Next. */
const config: CapacitorConfig = {
  appId: "com.carsaimz.cube",
  appName: "C-Cube",
  webDir: ".next-static",
  backgroundColor: "#07080d",
  android: {
    backgroundColor: "#07080d",
    allowMixedContent: false,
  },
  server: {
    androidScheme: "https",
  },
};

export default config;

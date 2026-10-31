import type { CapacitorConfig } from "@capacitor/cli";

/** C-Cube — configuração Capacitor (Android). WebDir = exportação estática do Next. */
const config: CapacitorConfig = {
  appId: "com.carsaimz.cube",
  appName: "C-Cube",
  webDir: ".next-static",
  backgroundColor: "#04050a",
  android: {
    backgroundColor: "#04050a",
    allowMixedContent: false,
  },
  server: {
    androidScheme: "https",
  },
};

export default config;

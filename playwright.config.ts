import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 40000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:8081",
    viewport: { width: 1440, height: 1100 },
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
        (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
      args: [
        "--no-sandbox",
        "--autoplay-policy=no-user-gesture-required",
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        ...(process.env.PANDEIRO_MIC_WAV
          ? [
              `--use-file-for-fake-audio-capture=${process.env.PANDEIRO_MIC_WAV}`,
            ]
          : []),
      ],
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  reporter: [["list"]],
  webServer: {
    command: "npm run web",
    url: "http://127.0.0.1:8081",
    reuseExistingServer: true,
    timeout: 120000,
  },
});

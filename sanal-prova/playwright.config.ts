import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
export default defineConfig({
  testDir: './ui-tests', timeout: 60000, workers: 1, fullyParallel: false,
  use: { baseURL: process.env.UI_BASE_URL ?? 'http://127.0.0.1:3100',
    launchOptions: { ...(existsSync(edge) ? { executablePath: edge } : {}),
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
    trace: 'retain-on-failure', screenshot: 'only-on-failure',
  },
});

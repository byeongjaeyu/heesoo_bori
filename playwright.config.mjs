import { defineConfig } from '@playwright/test';
// 로컬에 설치된 크롬이 있으면 그걸 쓰고(CHROME_PATH), CI 에서는 playwright 가 설치한 chromium
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    viewport: { width: 420, height: 860 },
    locale: 'ko-KR', // 게임은 브라우저 언어로 한국어/영어를 고름 — 테스트는 한국어 기준 (영어는 i18n-en.spec 에서 따로)
    launchOptions: process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] } : {}
  }
});

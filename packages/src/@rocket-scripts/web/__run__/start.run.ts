import { start } from '@rocket-scripts/web/start';
import { copyFixture } from '@ssen/copy-fixture';
import { exec } from '@ssen/promised';
import puppeteer from 'puppeteer';

(async () => {
  const cwd: string = await copyFixture('test/fixtures/web/start');

  // await exec(`yarn --production`, { cwd });
  //await exec(`code ${cwd}`);

  const { port } = await start({
    cwd,
    staticFileDirectories: ['{cwd}/public'],
    app: 'app',
  });

  const browser = await puppeteer.launch({
    //userDataDir: process.env.CHROMIUM_USER_DATA_DEBUG,
    headless: false,
    args: ['--start-fullscreen'],
    devtools: true,
  });

  const [page] = await browser.pages();
  await page.goto(`http://localhost:${port}`);
})();

import { start } from '@rocket-scripts/electron';
import { copyFixture } from '@ssen/copy-fixture';
import { createInkWriteStream } from '@ssen/ink-helpers';
import fs from 'fs-extra';
import path from 'path';
import { getPortPromise } from 'portfinder';
import puppeteer, { Browser } from 'puppeteer-core';

const timeout = (t: number) => new Promise((resolve) => setTimeout(resolve, t));

describe('electron/start', () => {
  test.each(['start'])(
    'should read h1 text and the text should change with watch (%s)',
    async (dir: string) => {
      // Arrange : project directories
      const cwd: string = await copyFixture(`test/fixtures/electron/${dir}`);
      const staticFileDirectories: string[] = ['{cwd}/public'];
      const app: string = 'app';
      const remoteDebuggingPort: number = await getPortPromise();

      // Arrange : stdout
      const stdout = createInkWriteStream();

      // Act : server start
      const { close } = await start({
        cwd,
        staticFileDirectories,
        app,
        stdout,
        logfile: '{cwd}/log.txt',
        electronSwitches: {
          'remote-debugging-port': remoteDebuggingPort,
        },
      });

      await timeout(1000 * 5);

      // Arrange : connect electron
      let browser: Browser | null = null;
      const connectTimeout: number = Date.now() + 1000 * 30;

      while (!browser) {
        try {
          browser = await puppeteer.connect({
            browserURL: `http://localhost:${remoteDebuggingPort}`,
          });
        } catch (error) {
          console.log(
            'start.test.ts..()',
            error,
            remoteDebuggingPort,
            Date.now(),
            connectTimeout,
            browser,
          );
          if (Date.now() > connectTimeout) {
            throw error;
          }
        }
      }

      const browserPages = await browser.pages();

      const indexPage = browserPages.find((page) =>
        /index\.html$/.test(page.url()),
      );
      if (!indexPage) throw new Error(`Undefined index.html`);

      // Assert
      await indexPage.waitForFunction(
        `document.querySelector('#app h1').innerHTML === 'Hello World!'`,
        {
          timeout: 1000 * 60,
          polling: 1000 * 3,
        },
      );

      // Act : update source file to be causing webpack watch
      const file: string = path.join(cwd, 'src/app/preload.ts');
      const source: string = await fs.readFile(file, 'utf8');
      await fs.writeFile(file, source.replace(/(Hello)/g, 'Hi'), {
        encoding: 'utf8',
      });

      await timeout(1000 * 5);

      const watchTimeout: number = Date.now() + 1000 * 60;

      while (true) {
        await indexPage.reload({ waitUntil: 'load' });

        await timeout(1000 * 5);

        // Assert : update browser text by webpack watch
        const text: string = await indexPage.$eval(
          '#app h1',
          (e) => e.innerHTML,
        );
        if (text === 'Hi World!') {
          break;
        } else if (Date.now() > watchTimeout) {
          throw new Error(`${text} is not "Hi World!"`);
        }
      }

      // Exit
      browser.disconnect();
      await close();

      console.log(stdout.lastFrame());
    },
  );
});

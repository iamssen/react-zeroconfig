import { build } from '@rocket-scripts/web/build';
import { copyFixture } from '@ssen/copy-fixture';
import { exec } from '@ssen/promised';

(async () => {
  const cwd: string = await copyFixture('test/fixtures/web/start');

  await build({
    cwd,
    staticFileDirectories: ['{cwd}/public'],
    app: 'app',
  });

  exec(`code ${cwd}`);
})();

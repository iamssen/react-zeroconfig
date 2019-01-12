import getCurrentTime from '../getCurrentTime';
import { Config } from '../types';
import watchTranslation from '../watchTranslation';

export = function ({appDirectory}: Config) {
  watchTranslation({
    appDirectory: appDirectory,
    outputPath: `${appDirectory}/src/generated/locales.json`,
    type: 'i18next',
  }).subscribe(
    () => {
      console.log(`[${getCurrentTime()}] 👍 Translation build is successful.`);
    },
    error => {
      console.error(`[${getCurrentTime()}] 💀 Translation build is failed.`);
      console.error(error);
    },
  );
};
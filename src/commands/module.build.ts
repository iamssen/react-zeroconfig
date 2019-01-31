import path from 'path';
import { Configuration } from 'webpack';
import buildModuleDeclarations from '../buildModuleDeclarations';
import copyModuleStaticFiles from '../copyModuleStaticFiles';
import createModuleBuildOptions from '../createModuleBuildOptions';
import createWebpackConfig from '../createWebpackConfig';
import getCurrentTime from '../getCurrentTime';
import removeDirectory from '../removeDirectory';
import { Config, ModuleBuildOption } from '../types';
import base from '../webpack/base';
import build from '../webpack/build-module';
import runWebpack = require('../runWebpack');

export = function (config: Config) {
  const {appDirectory, modules} = config;
  const outputPath: string = path.join(appDirectory, 'dist/modules');
  const extractCss: boolean = true;
  
  removeDirectory(outputPath)
    .then(() => {
      return createModuleBuildOptions({
        appDirectory: appDirectory,
        modules: modules.entry,
      });
    })
    .then((buildOptions: ModuleBuildOption[]) => new Promise((resolve: () => void, reject: (error: Error) => void) => {
      let i: number = -1;
      
      function func() {
        if (++i < buildOptions.length) {
          const buildOption: ModuleBuildOption = buildOptions[i];
          
          Promise.all([
            buildModuleDeclarations({
              appDirectory,
              buildOption,
            }),
            copyModuleStaticFiles({
              appDirectory,
              buildOption,
            }),
            createWebpackConfig(config, [
              base({
                mode: 'production',
              }),
              build({extractCss, buildOption}),
            ]).then((webpackConfig: Configuration) => {
              return runWebpack(config, webpackConfig);
            }),
          ]).then(() => func())
            .catch((error: Error) => reject(error));
        } else {
          resolve();
        }
      }
      
      func();
    }))
    .then(() => {
      console.log(`[${getCurrentTime()}] 👍 Module build is successful.`);
    })
    .catch((error: Error) => {
      console.error(`[${getCurrentTime()}] 💀 Module build is failed.`);
      console.error(error);
    });
}
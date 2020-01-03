import fs from 'fs-extra';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import { Configuration } from 'webpack';
import webpackMerge from 'webpack-merge';
import { watchWebpack } from '../runners/watchWebpack';
import { DesktopappConfig } from '../types';
import { sayTitle } from '../utils/sayTitle';
import { createWebpackBaseConfig } from '../webpackConfigs/createWebpackBaseConfig';
import { createWebpackEnvConfig } from '../webpackConfigs/createWebpackEnvConfig';
import { createWebpackWebappConfig } from '../webpackConfigs/createWebpackWebappConfig';

export async function watchElectron({
                                      cwd,
                                      app,
                                      zeroconfigPath,
                                      staticFileDirectories,
                                      output,
                                      extend,
                                    }: DesktopappConfig) {
  const baseConfig: Configuration = createWebpackBaseConfig({zeroconfigPath});
  const webappConfig: Configuration = createWebpackWebappConfig({
    extractCss: true,
    cwd,
    chunkPath: '',
    publicPath: '',
    internalEslint: true,
  });
  const envConfig: Configuration = createWebpackEnvConfig({
    serverPort: 0,
    publicPath: '',
  });
  
  const webpackMainConfig: Configuration = webpackMerge(
    baseConfig,
    {
      target: 'electron-main',
      mode: 'development',
      devtool: 'source-map',
      
      entry: {
        main: path.join(cwd, 'src', app, 'main'),
      },
      
      output: {
        path: path.join(output, 'electron'),
      },
    },
    webappConfig,
    envConfig,
  );
  
  const webpackRendererConfig: Configuration = webpackMerge(
    baseConfig,
    {
      target: 'electron-renderer',
      mode: 'development',
      devtool: 'source-map',
      
      entry: {
        index: path.join(cwd, 'src', app, 'index'),
      },
      
      output: {
        path: path.join(output, 'electron'),
      },
      
      plugins: [
        // create css files
        new MiniCssExtractPlugin({
          filename: `[name].css`,
        }),
        
        // create html files
        ...(extend.templateFiles.length > 0 ? extend.templateFiles.map(templateFile => {
          const extname: string = path.extname(templateFile);
          const filename: string = path.basename(templateFile, extname);
          
          return new HtmlWebpackPlugin({
            template: path.join(cwd, 'src', app, templateFile),
            filename: filename + '.html',
            chunks: ['index'],
          });
        }) : []),
      ],
    },
    webappConfig,
    envConfig,
  );
  
  try {
    sayTitle('COPY FILES');
    
    const copyTo: string = path.join(output, 'electron');
    await fs.mkdirp(copyTo);
    await Promise.all(staticFileDirectories.map(dir => fs.copy(dir, copyTo, {dereference: false})));
    
    // TODO file watch - sync
    
    // watch webpack
    watchWebpack(webpackMainConfig).subscribe({
      next: webpackMessage => {
        sayTitle('WATCH ELECTRON MAIN');
        console.log(webpackMessage);
      },
      error: error => {
        sayTitle('⚠️ WATCH ELECTRON MAIN ERROR');
        console.error(error);
      },
    });
    
    // watch webpack
    watchWebpack(webpackRendererConfig).subscribe({
      next: webpackMessage => {
        sayTitle('WATCH ELECTRON RENDERER');
        console.log(webpackMessage);
      },
      error: error => {
        sayTitle('⚠️ WATCH ELECTRON RENDERER ERROR');
        console.error(error);
      },
    });
  } catch (error) {
    sayTitle('⚠️ COPY FILES ERROR');
    console.error(error);
  }
}
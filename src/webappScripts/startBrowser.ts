import LoadablePlugin from '@loadable/webpack-plugin';
import browserSync, { MiddlewareHandler, Options } from 'browser-sync';
import compression from 'compression';
import fs from 'fs-extra';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { IncomingMessage, ServerResponse } from 'http';
import proxyMiddleware from 'http-proxy-middleware';
import path from 'path';
import webpack, { Compiler, Configuration, HotModuleReplacementPlugin } from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import webpackMerge from 'webpack-merge';
import { WebappConfig } from '../types';
import { sayTitle } from '../utils/sayTitle';
import { createBaseWebpackConfig } from '../webpackConfigs/createBaseWebpackConfig';
import { createBrowserAppWebpackConfig } from '../webpackConfigs/createBrowserAppWebpackConfig';
import { createWebappWebpackConfig } from '../webpackConfigs/createWebappWebpackConfig';

// work
// - [x] serve js, css files by webpack middlewares
// - [x] serve static files by browser-sync
// - [x] create loadable-stats.json when server side rendering is enabled
// - [x] serve html files when templates are exists
// staticFileDirectories
// - [x] serve static file directories by browser-sync
// sizeReport
// - none of effect to this task
// mode
// - none of effect to this task
// output
// - [x] loadable-stats.json
// - [x] serve static files
// - [x] mkdirp before create loadable-stats.json
// appFileName
// - [x] entry name
// vendorFileName
// - [x] using on chunks2-webpack-plugin
// - [x] pass to createBrowserAppWebpackConfig
// styleFileName
// - [x] using on chunks2-webpack-plugin
// - [x] pass to createBrowserAppWebpackConfig
// chunkPath
// - [x] pass to createBrowserAppWebpackConfig
// publicPath
// - [x] webpack public path
// - [x] process.env.PUBLIC_PATH
// port
// - [x] browser-sync port
// serverPort
// - [x] process.env.SERVER_PORT
// https
// - [x] browser-sync https
// extend.serverSideRendering
// - [x] create output directory for create loadable-stats.json
// - [x] create loadable-stats.json
// extend.templateFiles
// - [x] create html files
export async function startBrowser({
                                     cwd,
                                     app,
                                     output,
                                     port,
                                     https,
                                     serverPort,
                                     staticFileDirectories,
                                     chunkPath,
                                     publicPath,
                                     appFileName,
                                     vendorFileName,
                                     styleFileName,
                                     extend,
                                     zeroconfigPath,
                                   }: WebappConfig) {
  const webpackConfig: Configuration = webpackMerge(
    createBaseWebpackConfig({zeroconfigPath}),
    {
      mode: 'development',
      devtool: 'cheap-module-eval-source-map',
      output: {
        path: cwd,
        publicPath,
      },
      entry: {
        [appFileName]: [
          `${path.dirname(require.resolve('webpack-hot-middleware/package.json'))}/client?http://localhost:${port}`,
          `${path.dirname(require.resolve('webpack/package.json'))}/hot/only-dev-server`,
          path.join(cwd, 'src', app),
        ],
      },
      optimization: {
        namedModules: true,
        noEmitOnErrors: true,
      },
      
      plugins: [
        new HotModuleReplacementPlugin(),
        
        // create loadable-stats.json when server side rendering enabled
        ...(extend.serverSideRendering ? [
          new LoadablePlugin({
            filename: path.join(output, 'loadable-stats.json'),
            writeToDisk: true,
          }),
        ] : []),
        
        // create html files
        ...(extend.templateFiles.length > 0 ? extend.templateFiles.map(templateFile => {
          const extname: string = path.extname(templateFile);
          const filename: string = path.basename(templateFile, extname);
          
          return new HtmlWebpackPlugin({
            template: path.join(cwd, 'src', app, templateFile),
            filename: filename + '.html',
          });
        }) : []),
      ],
    },
    createWebappWebpackConfig({
      extractCss: false,
      cwd,
      serverPort,
      publicPath,
    }),
    createBrowserAppWebpackConfig({
      chunkPath,
      vendorFileName,
      styleFileName,
      hash: '',
    }),
  );
  
  const compiler: Compiler.Watching | Compiler = webpack(webpackConfig);
  
  const middleware: MiddlewareHandler[] = [
    webpackDevMiddleware(compiler, {
      publicPath: publicPath,
      stats: {colors: true},
    }),
    webpackHotMiddleware(compiler),
    compression(),
  ];
  
  if (extend.serverSideRendering) {
    middleware.push(
      proxyMiddleware(['**', '!**/*.*'], {
        target: `http://localhost:${serverPort}`,
      }),
    );
  } else {
    middleware.push(
      function (req: IncomingMessage, res: ServerResponse, next: () => void) {
        if (req.url && !/\.[a-zA-Z0-9]+$/.test(req.url)) {
          req.url = '/index.html';
        }
        return next();
      },
    );
  }
  
  const browserSyncConfig: Options = {
    port,
    open: false,
    ghostMode: false,
    //@ts-ignore missing type
    https,
    
    server: {
      baseDir: staticFileDirectories,
      middleware,
    },
    
    files: staticFileDirectories,
  };
  
  // create output directory if not exists for loadable-stats.json
  if (extend.serverSideRendering) await fs.mkdirp(path.join(output));
  
  // run browser-sync
  sayTitle('START BROWSER-SYNC + WEBPACK');
  browserSync(browserSyncConfig, error => {
    if (error) console.error(error);
  });
}
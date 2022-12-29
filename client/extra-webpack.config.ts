import { CustomWebpackBrowserSchema } from '@angular-builders/custom-webpack';

import * as path from 'path';
import { Configuration } from 'webpack';

const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const findLoader = (webpackConfig, regex) =>
  webpackConfig.module.rules
    .filter((rule) => !!rule.use)
    .find((rule) => rule.use.find((it) => !!it.loader && regex.test(it.loader)));

interface CustomConfiguration extends Configuration {
  devServer: object;
}

module.exports = (config: CustomConfiguration, options: CustomWebpackBrowserSchema) => {
  // skip monaco editor because of DI problem
  // related to: https://github.com/angular/angular-cli/issues/14033
  // angular-cli update don't fully solves the DI problem, one service still seems to be broken by build-optimizer
  // Error: [createInstance] e depends on UNKNOWN service IMarkerNavigationService
  if (options.buildOptimizer) {
    const loader = findLoader(config, /@angular-devkit[\/\\]build-angular.*[\/\\]webpack-loader/);
    const originalTest = loader.test;
    loader.test = (file) => !file.match(/node_modules[\/\\]monaco-editor/) && !!file.match(originalTest);
  }

  // update angular devServer with proxy config
  config.devServer = {
    ...config.devServer,
    proxy: {
      '/api': {
        target: 'http://localhost:5675',
        ws: true,

        onError(err) {
          console.log('Backend not available:', err);
        },
      },
      '/socket.io/*': {
        target: 'http://localhost:5675',
        ws: true,

        onError(err) {
          console.log('Backend not available:', err);
        },
      },
      '^/sockjs-node/*': {
        target: 'http://localhost:5675',
        ws: true,

        onError(err) {
          console.log('Backend not available:', err);
        },
      },
    },
  };

  config.plugins.push(new MonacoWebpackPlugin({ languages: ['yaml'] }));
  config.module.rules.push({
    test: /\.css$/,
    include: path.join(__dirname, 'node_modules/monaco-editor'),
    use: [
      {
        loader: 'css-loader',
        options: {
          url: false,
        },
      },
    ],
  });

  return config;
};

process.on('uncaughtException', function (err) {
  console.error(err.stack);
  console.log('Waiting for backend to become live...');
});

/**
 * WebPack Configuration for California Department of Technology
 * 
 * Utilizes WordPress Scripts Webpack configuration as base.
 * s 
 * @link https://webpack.js.org/configuration/
 */

/**
 * External dependencies
 */
import baseConfig from '@wordpress/scripts/config/webpack.config.js';
import path from 'path';
import fs from 'fs';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import {HtmlWebpackSkipAssetsPlugin} from 'html-webpack-skip-assets-plugin';

import MiniCssExtractPlugin from "mini-css-extract-plugin";

/**
 * Internal dependencies
 */
import {
  projectPath,
  appPath
} from '../lib/index.js';

const samplePath = path.join( appPath, 'sample');
const srcPath = path.join( appPath, 'src');
const dataPath = path.join( srcPath, 'data');

import SiteGenerator from '../gen/site-generator.js';

// Update some of the default WordPress webpack rules.
baseConfig.module.rules.forEach((rule, i) => {
  const r = new RegExp(rule.test).toString();

  switch(r){
    // WordPress adds a hash to asset file names we remove that hash.
    case new RegExp(/\.(bmp|png|jpe?g|gif|webp)$/i).toString():
      rule.generator.filename = 'images/[name].[ext]';
      break;
    case new RegExp(/\.(woff|woff2|eot|ttf|otf)$/i).toString():
      rule.generator.filename = 'fonts/[name].[ext]';
      break;
    case new RegExp(/\.svg$/).toString():
      // we don't want SVG to be asset/inline otherwise the resource may not be available.
      // the asset should be an asset/resource we move them to the fonts folder. 
      if( 'asset/inline' === rule.type ){
        rule.type = 'asset/resource';
        rule.generator = { filename: 'fonts/[name].[ext]' };

        delete rule.issuer;
      }
      break;
  }
});

// Our Webpack Configuration.
let webpackConfig = {
  ...baseConfig,
  target: 'web',
  cache: false,
  output: {
    ...baseConfig.output,
    publicPath: `/`,
    clean: true
  },
  performance: {
    maxAssetSize: 500000,
    maxEntrypointSize: 500000
  }
};

// Delete the default WP Dev Server
delete webpackConfig.devServer;

// Only add the Dev Server if the serve command is ran.
if( 'serve' === process.argv[2] ){

  // Add html rule
  webpackConfig.module.rules = [
    ...baseConfig.module.rules,
    {
      test: /\.html$/,
      loader:'handlebars-loader'
    }
  ]

  // we only want to display errors and warnings
  webpackConfig.stats = 'errors-warnings';

  let pageTemplate = {
    title: path.basename(appPath),
    minify: false,
    meta: {
      "Author": "CAWebPublishing",
      "Description": "State of California",
      "Keywords": "California,government",
      "viewport": "width=device-width, initial-scale=1.0, minimum-scale=1.0"
    },
    templateParameters: {
      "title" : path.basename(appPath)
    },
    skipAssets: ['**/index-rtl.css']
  }

  // if an favicon exists.
  if( fs.existsSync(path.join(srcPath, 'favicon.ico')) ){
    pageTemplate.favicon = path.join(srcPath, 'favicon.ico');
  }

  // Sample Page.
  let sample = {
    ...pageTemplate,
    filename: path.join( appPath, 'public', 'index.html'),
    template: path.join(samplePath, 'index.html')
  }

  webpackConfig.plugins.push(
    new HtmlWebpackPlugin(sample),
    new HtmlWebpackSkipAssetsPlugin()
  );

  webpackConfig.devServer = {
    devMiddleware: {
      writeToDisk: true
    },
    headers: {
    },
    hot: true,
    allowedHosts: 'auto',
    host: 'localhost',
    port: 9000,
    compress: true,
    static: [
      {
        directory: path.join( appPath, 'build'),
      },
      {
        directory: path.join(appPath, 'public'),
      },
      {
        directory: path.join(appPath, 'node_modules'),
      },
      {
        directory: path.join(appPath, 'src'),
      },
      {
        directory: path.join(projectPath, 'bin', 'css-audit', 'public'),
      }
    ],
    proxy: [
      {
        context: ['/node_modules'],
        target: 'http://localhost:9000',
        pathRewrite: { '^/node_modules': '' },
      },
      {
        context: ['/src'],
        target: 'http://localhost:9000',
        pathRewrite: { '^/src': '' },
      }
    ],
  }


}

export default webpackConfig;
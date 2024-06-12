/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import jsdom from 'jsdom';
import { fileURLToPath } from 'url';

/**
 * Internal dependencies
 */
import {
  generatePages
} from './parser.js';

/*import {
  projectPath,
  appPath
} from '../lib/index.js';
*/
const currentPath = path.dirname(fileURLToPath(import.meta.url));
const projectPath = path.resolve( currentPath, '..' );
const appPath = path.resolve( process.cwd() );
const samplePath = path.join( appPath, 'sample');
const srcPath = path.join( appPath, 'src');
const dataPath = path.join( srcPath, 'data');
//const assetsPath = path.join( srcPath, 'assets');

// default meta used for site generation when no meta is passed
const meta = {
  "Author": "CAWebPublishing",
  "Description": "State of California",
  "Keywords": "California,government",
  "viewport": "width=device-width, initial-scale=1.0, minimum-scale=1.0"
}


/**
 * Returns an object containing all data from site.json and src/data/examples.json
 *
 * @returns {Object}
 */
function getSiteData(){

  // grab any sample data if it exists.
  let sample = fs.existsSync( path.join(dataPath, 'examples.json') ) ? JSON.parse( fs.readFileSync( path.join(dataPath, 'examples.json') ) ) : {};
  
  // grab any site data if it exists.
  let site = fs.existsSync( path.join(appPath, 'site.json') ) ? JSON.parse( fs.readFileSync( path.join(appPath, 'site.json') ) ) : {};
  
  // merge datasets together
  let siteData = {
    ...sample,
    ...site
  };
  
  return siteData;
}

export default (webpackConfig) => {
  // we only proceed if and index.html exists
  if( ! fs.existsSync( path.join( samplePath, 'index.html' )) ){
    return;
  }

  // we only want to display errors and warnings
  webpackConfig.stats = 'errors-warnings';

  // get site data
  let siteData = getSiteData();

  /**
   * Favicon
   * 
   * Locations:
   * - ./favicon.ico - root of the project
   * - ./src/favicon.ico - src directory
   * - favicon.ico - default icon
   */
  let favicon = fs.existsSync(path.join(appPath, 'favicon.ico')) ?
    path.join(appPath, 'favicon.ico') :
    ( 
      fs.existsSync(path.join(srcPath, 'favicon.ico')) ? 
        path.join(srcPath, 'favicon.ico') : 
        path.join(projectPath, 'assets', 'logo.ico')  
    );

  let defaultPage = {
    minify: false,
    favicon,
    meta: siteData.meta || meta,
  }

  // add html
  webpackConfig.plugins = [
    ...webpackConfig.plugins,
    new HtmlWebpackPlugin({
      filename: path.join( appPath, 'public', 'index.html'),
      template: path.join(samplePath, 'index.html'),
      //templateContent: generatePages(siteData),
      title: 'Test Site',
      ...defaultPage
    })
  ]

  // add devServer
  webpackConfig.devServer = {
    devMiddleware: {
      writeToDisk: true,
    },
    hot: false,
    allowedHosts: 'auto',
    host: 'localhost',
    port: 9000,
    compress: true,
    static: [
      {
        directory: path.join( appPath, 'build'),
      },
      {
        directory: path.join(appPath, 'node_modules'),
      },
      {
        directory: path.join(appPath, 'public'),
      },
      {
        directory: path.join(appPath, 'src'),
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
};
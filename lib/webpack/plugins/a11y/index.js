#!/usr/bin/env node

/**
 * External dependencies
 */
import { sync as resolveBin } from 'resolve-bin';
import spawn from 'cross-spawn';
import { getAllFilesSync } from 'get-all-files'
import EntryDependency from "webpack/lib/dependencies/EntryDependency.js";
import path from 'path';
import { isUrl, isValidUrl } from 'check-valid-url';
import fs from 'fs';
import deepmerge from 'deepmerge';
import chalk from 'chalk';
import { fileURLToPath, URL } from 'url';

// default configuration
import {default as DefaultConfig} from './aceconfig.js';

const boldWhite = chalk.bold.white;
const boldGreen = chalk.bold.green;
const boldBlue = chalk.bold.hex('#03a7fc');
const currentPath = path.dirname(fileURLToPath(import.meta.url));

// IBM Accessibility Checker Plugin
class A11yPlugin {
    config = {}

    constructor(opts = {}) {
      // outputFolder must be resolved
      if( opts.outputFolder ){
        opts.outputFolder = path.join(process.cwd(), opts.outputFolder);
      }
      this.config = deepmerge(
        DefaultConfig, 
        {
          outputFolder: path.join(currentPath, DefaultConfig.outputFolder)
        },
        opts
      );
    }

    apply(compiler) {
      const staticDir = {
        directory: this.config.outputFolder,
        watch: true
      }
      let { devServer, output } = compiler.options;
      let hostUrl = 'localhost' === devServer.host ? `http://${devServer.host}`: devServer.host;
      let hostPort = devServer.port;

      if( hostPort && 80 !== hostPort )
      {
          hostUrl = `${hostUrl}:${hostPort}`;
      }

      // if dev server allows for multiple pages to be opened
      // add outputFilename.html to open property.
      if( Array.isArray(devServer.open) ){
        devServer.open.push(`${hostUrl}/${this.config.outputFilename}.html`)
      }else if( 'object' === typeof devServer.open && Array.isArray(devServer.open.target) ){
        devServer.open.target.push(`${hostUrl}/${this.config.outputFilename}.html`)
      }

      // add our static directory 
      if( Array.isArray(devServer.static) ){
        devServer.static.push(staticDir)
      }else{
        devServer.static = [].concat(devServer.static, staticDir );
      }
      
      // Wait for configuration preset plugins to apply all configure webpack defaults
      compiler.hooks.initialize.tap('IBM Accessibility Plugin', () => {
        compiler.hooks.compilation.tap(
          "IBM Accessibility Plugin",
          (compilation, { normalModuleFactory }) => {
            compilation.dependencyFactories.set(
              EntryDependency,
              normalModuleFactory
            );
          }
        );

        const { entry, options, context } = {
          entry: path.join( this.config.outputFolder, 'a11y.update.js'),
          options: {
            name: 'a11y'
          },
          context: 'a11y'
        };

        const dep = new EntryDependency(entry);
        dep.loc = {
          name: options.name
        };
        if( ! fs.existsSync(path.resolve(this.config.outputFolder))){
          fs.mkdirSync( path.resolve(this.config.outputFolder), {recursive: true} );
        }
        
        fs.writeFileSync(
          path.join(this.config.outputFolder, `a11y.update.js`),
          `` // required for hot-update to compile on our page, blank script for now
        );


        compiler.hooks.thisCompilation.tap('IBM Accessibility Plugin',
          /**
           * Hook into the webpack compilation
           * @param {Compilation} compilation
           */
          (compilation) => {
            
            compiler.hooks.make.tapAsync("IBM Accessibility Plugin", (compilation, callback) => {
              
              compilation.addEntry(
              context,
              dep, 
              options, 
              err => {
                callback(err);
              });
            });

            compiler.hooks.done.tapAsync(
              'IBM Accessibility Plugin',
              /**
               * Hook into the process assets hook
               * @param {any} _
               * @param {(err?: Error) => void} callback
               */
              ({compilation}, callback) => {
                  
                console.log(`<i> ${boldGreen('[webpack-dev-middleware] Running IBM Accessibility scan...')}`);

                this.a11yCheck(path.join(process.cwd(), output.publicPath ?? '/' ), this.config );

                console.log(`<i> ${boldGreen('[webpack-dev-middleware] IBM Accessibilty Report can be viewed at')} ${ boldBlue(new URL(`${hostUrl}/${this.config.outputFilename}.html`).toString())  }`);

                callback();
            });

            compiler.hooks.watchClose.tap( 'IBM Accessibility Plugin', () => {
              getAllFilesSync(compiler.options.output.path).toArray().forEach(f => {
                if( 
                  f.includes('a11y') || // delete any a11y files
                  f.includes('.hot-update.js') // delete any HMR files
                ){
                  fs.rmSync(f)
                }
              })
            });
            
        });

    });
    
    }

    /**
     * Run accessibility checks
     * 
     * @param {Object}  options
     * @param {boolean} options.debug            True if debug mode is enabled.
     * @param {boolean} options.ruleArchive   Specify the rule archive.
     * @param {boolean} options.policies   Specify one or many policies to scan.
     * @param {boolean} options.failLevels   Specify one or many violation levels on which to fail the test.
     * @param {boolean} options.reportLevels   Specify one or many violation levels that should be reported.
     * @param {boolean} options.labels   Specify labels that you would like associated to your scan.
     * @param {boolean} options.outputFormat   In which formats should the results be output.
     * @param {boolean} options.outputFilename   Filename for the scan results.
     * @param {boolean} options.outputFolder   Where the scan results should be saved.
     * @param {boolean} options.outputFilenameTimestamp   Should the timestamp be included in the filename of the reports?
     */
    a11yCheck(url, {
      debug, 
      ruleArchive,
      policies,
      failLevels,
      reportLevels,
      labels,
      outputFormat,
      outputFilename, 
      outputFolder,
      outputFilenameTimestamp
    }){

      let acheckerArgs = [
        '--ruleArchive',
        ruleArchive,
        '--policies',
        Array.isArray(policies) ? policies.filter(e => e).join(',') : policies,
        '--failLevels',
        Array.isArray(failLevels) ? failLevels.filter(e => e).join(',') : failLevels,
        '--reportLevels',
        Array.isArray(reportLevels) ? reportLevels.filter(e => e).join(',') : reportLevels,
        '--outputFolder',
        outputFolder,
        '--outputFormat',
        outputFormat,
        '---outputFilenameTimestamp',
        outputFilenameTimestamp,
        url
      ];
    
      let isValid = false;

      if( fs.existsSync( url ) ){
          if( fs.statSync(url).isDirectory() &&  path.join( url, 'index.html') ){
              url = path.join( url, 'index.html')
          }
          isValid = true;
      }else{
          isValid = 'localhost' === new URL(url).hostname || isUrl( url )
      }

      if( isValid ){
        let originalFileName =  `${fs.existsSync( url ) ?
          path.resolve(url).replace(':', '_') :
          url.replace(/http[s]+:\/\//, '')}.html`;
        let originalJsonFileName =  `${fs.existsSync( url ) ?
            path.resolve(url).replace(':', '_') :
            url.replace(/http[s]+:\/\//, '')}.json`;

        let outputDir = path.resolve('.',  outputFolder );

        let {stderr, stdout}  = spawn.sync( 
          resolveBin('accessibility-checker', {executable: 'achecker'}),
          acheckerArgs,
          {
            stdio: 'pipe',
            timeout: 30000 // stop after 30 seconds
          }
        )

        if( stderr && stderr.toString() ){
            console.log( stderr.toString() );
        }
        
        if( stdout && stdout.toString()){
          let reportedFile =  path.join(outputDir, originalFileName );
          let reportedJSon =  path.join(outputDir, originalJsonFileName );

          // if output file name option was passed
          if( outputFilename ){

              reportedFile =  path.join( outputDir, `${outputFilename}.html` );
              reportedJSon =  path.join( outputDir, `${outputFilename}.json` );

              // rename the output files
              fs.renameSync(path.join(outputDir, originalFileName), reportedFile );
              fs.renameSync(path.join(outputDir, originalJsonFileName), reportedJSon );

              // delete any empty directories.
              fs.rmSync( path.join(outputDir, originalFileName.split(path.sep).shift()), {recursive: true} )
          }

          if( 'a11y' === process.argv[2] ){
              console.log( reportedFile )
          }else{
              return reportedFile;
          }
        }
      }else{
        console.log( `${url} is not a valid url.` )
      }

    } // end of a11yCheck

} // end of class
  

export default A11yPlugin;
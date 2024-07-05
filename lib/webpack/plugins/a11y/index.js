#!/usr/bin/env node

/**
 * External dependencies
 */
import { sync as resolveBin } from 'resolve-bin';
import spawn from 'cross-spawn';

import path from 'path';
import { isUrl, isValidUrl } from 'check-valid-url';
import fs from 'fs';
import deepmerge from 'deepmerge';
import chalk from 'chalk';
import { URL } from 'url';

const boldWhite = chalk.bold.white;
const boldGreen = chalk.bold.green;
const boldBlue = chalk.bold.hex('#03a7fc');

// IBM Accessibility Checker Plugin
class A11yPlugin {
    config = {
      ruleArchive: 'latest',
      policies: [
          'WCAG_2_1'
      ],
      failLevels: [],
      reportLevels: [
          'violation', 
          'potentialviolation',
          'recommendation',
          'potentialrecommendation',
          'manual',
          'pass'
      ],
      outputFolder: "a11y",
      outputFormat: [
          'html'
      ],
      outputFilenameTimestamp: false
    }

    constructor(opts = {}) {
      this.config = deepmerge(this.config, opts);
    }

    apply(compiler) {
      compiler.hooks.done.tapPromise(
        'IBM Accessibility Plugin',
          async (
          {compilation}
        ) => {
          try{
            
            let { devServer, output } = compilation.options;

            let hostUrl = 'localhost' === devServer.host ? `http://${devServer.host}`: devServer.host;
            let hostPort = devServer.port;

            if( hostPort && 80 !== hostPort )
            {
                hostUrl = `${hostUrl}:${hostPort}`;
            }

            let report = this.a11yCheck(path.join(process.cwd(), output.publicPath ?? '/' ), this.config );
            let fileLocation = report.replace(path.join(process.cwd(), this.config.outputFolder), '');

            console.log(`<i> ${boldGreen('[webpack-dev-middleware] IBM Accessibilty Report can be viewed at')} ${ boldBlue(new URL(`${hostUrl}${fileLocation}`).toString())  }`);

          }catch(err){
            console.log( err )
          }
        }
      );
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
        Array.isArray(policies) ? policies.join(',') : policies,
        '--failLevels',
        Array.isArray(failLevels) ? failLevels.join(',') : failLevels,
        '--reportLevels',
        Array.isArray(reportLevels) ? reportLevels.join(',') : reportLevels,
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

        let { stdout, stderr } = spawn.sync( 
          resolveBin('accessibility-checker', {executable: 'achecker'}),
          acheckerArgs,
          {
            stdio: 'pipe'
          }
        )

        if( stderr && stderr.toString() ){
            console.log( stderr.toString() );
        }
        
        if( stdout ){
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
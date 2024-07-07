#!/usr/bin/env node

/**
 * External dependencies
 */
import { sync as resolveBin } from 'resolve-bin';
import spawn from 'cross-spawn';
import { getAllFiles, getAllFilesSync } from 'get-all-files'

import path from 'path';
import { isUrl, isValidUrl } from 'check-valid-url';
import fs from 'fs';
import deepmerge from 'deepmerge';
import chalk from 'chalk';
import { fileURLToPath, URL } from 'url';

const boldWhite = chalk.bold.white;
const boldGreen = chalk.bold.green;
const boldBlue = chalk.bold.hex('#03a7fc');
const currentPath = path.dirname(fileURLToPath(import.meta.url));

// JSHint Plugin
class JSHintPlugin {
    config = {
    }

    constructor(opts = {}) {
      this.config = deepmerge(this.config, opts);
    }

    apply(compiler) {
      compiler.hooks.done.tapPromise(
        'JSHint Plugin',
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

            console.log(`<i> ${boldGreen('[webpack-dev-middleware] Running JSHint...')}`);

            this.audit([output.path], this.config );

            console.log(`<i> ${boldGreen('[webpack-dev-middleware] JSHint can be viewed at')} ${ boldBlue(new URL(`${hostUrl}/${this.config.filename}.html`).toString())  }`);

          }catch(err){
            console.log( err )
          }
        }
      );
    }

    /**
     * Run JSHint
     *
     * @param {Array} files
     * @param {Object}  options
     * @param {boolean} options.debug
     * @param {boolean} options.outputFilename   Filename for the scan results.
     * @param {boolean} options.outputFolder   Where the scan results should be saved.
     */
    hint(files, {
      debug,
      outputFolder,
      outputFilename
    }){

      let filesToBeAuditted = [];
      let filesWithIssues = [];

      files.forEach( (paths, i) => {
        let resolvePath = path.resolve(paths);

        try {
            // if given path is a directory
            if( fs.statSync(resolvePath).isDirectory() ){

                // get all .css files
                getAllFilesSync(resolvePath).toArray().forEach(f => {
                    if( f.endsWith('.js') ){
                      filesToBeAuditted.push(f)
                    }
                })
            // if given path is a file and a .css file
            }else if( fs.statSync(paths).isFile() && paths.endsWith('.js') ){
              filesToBeAuditted.push(paths)
            }
        // invalid path/file
        } catch (error) {
          filesWithIssues.push(paths)
        }

      });

      if( ! filesToBeAuditted.length ){
        console.log('No file(s) or directory path(s) were given or default directory was not found.')
        console.log('Hinter did not execute.');
        return
      }

      let hintArgs = [
        '--config',
        fs.existsSync(path.join(process.cwd(), '.jshintrc')) ? path.join(process.cwd(), '.jshintrc') : path.join(currentPath, '.jshintrc')
      ].filter( e => e)
      
      let { stdout, stderr } = spawn.sync( 
        'jshint',
        [
          ...filesToBeAuditted,
          ...hintArgs
        ],
        {
          stdio: 'pipe',
        }
      )

      if( stderr && ! stderr.toString() ){
        console.log( stderr.toString())
      }

      if( stdout.length  ){
        
          let outputDir = path.resolve( outputFolder );
          fs.mkdirSync( outputDir, {recursive: true} );
          
          // header
          let output = ['<div>\n\t<h1>JSHint Report</h1>\n</div>']

          let it = stdout.entries();
          let itr = it.next();
          let line = '';
          let char = '';

          let errors = [];

          //using while loop to access all elements
          while( ! itr.done ){ 
            char = Buffer.from([itr.value[1]]).toString();
            if('\n' !== char ){
              line += char;
            }else{
              if( line.length ){
                /**
                 * - create links for the files
                 * - wrap each line in a div
                 */
                errors.push( `\t<li>\n\t\t${line.replace(/(.*)(: line \d+)/g, '<a href="$1" target="_blank">$1</a>$2')}\n\t</li>\n` );
              }
              
              line = '';
            }
            
            //pointing pointer to next element
            itr = it.next();
          }

          // error count.
          let errorCount = errors.pop().replace(/[\s\S\w]*([\d]+)[\s\S\w]*/g, '$1');
          output.push( `<div>\n\t<h2>Errors Detected ( ${errorCount} )</h2>\n</div>` );
          
          // open ul for report list
          output.push( '<ol>' );

          // add errors to output
          output.push( ...errors );

          // open ul for report list
          output.push( '</ol>' );
                    
          fs.writeFileSync(
            path.join(outputDir, `${outputFilename}.html`),
            output.join('\n')
          );

          return path.join(outputDir, `${outputFilename}.html`);
      }else{
        console.log( 'No output generated.')
        return false;
      }
      
    } // end of hint

} // end of class
  

export default JSHintPlugin;
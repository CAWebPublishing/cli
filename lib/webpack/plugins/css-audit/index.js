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

// CSS Audit Plugin
class CSSAuditPlugin {
    config = {
      format: 'html',
	    filename: 'css-audit',
      colors: true,
      important: true,
      displayNone: true,
      selectors: true,
      mediaQueries: true,
      typography: true,
      propertyValues: [
        'font-size',
        'padding,padding-top,padding-bottom,padding-right,padding-left' ,
        'property-values', 'margin,margin-top,marin-bottom,marin-right,marin-left',
      ]
    }

    constructor(opts = {
      format,
      filename,
      colors,
      important,
      displayNone,
      selectors,
      mediaQueries,
      typography,
      propertyValues
    }) {
      this.config = deepmerge(this.config, opts);
    }

    apply(compiler) {
      compiler.hooks.done.tapPromise(
        'CSS Audit Plugin',
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

            console.log(`<i> ${boldGreen('[webpack-dev-middleware] Running CSS Audit...')}`);

            this.audit([output.path], this.config );

            console.log(`<i> ${boldGreen('[webpack-dev-middleware] CSS Audit can be viewed at')} ${ boldBlue(new URL(`${hostUrl}/${this.config.filename}.html`).toString())  }`);

          }catch(err){
            console.log( err )
          }
        }
      );
    }

    /**
     * Run CSS Auditor
     *
     * @param {Array} files
     * @param {Object}  options
     * @param {boolean} options.debug
     * @param {boolean} options.format
     * @param {boolean} options.filename
     * @param {boolean} options.colors
     * @param {boolean} options.important
     * @param {boolean} options.displayNone
     * @param {boolean} options.selectors
     * @param {boolean} options.mediaQueries
     * @param {boolean} options.typography
     * @param {Array} options.propertyValues
     */
    audit(files, {
      debug,
      format,
      filename,
      colors,
      important,
      displayNone,
      selectors,
      mediaQueries,
      typography,
      propertyValues
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
                    if( f.endsWith('css') ){
                      filesToBeAuditted.push(f)
                    }
                })
            // if given path is a file and a .css file
            }else if( fs.statSync(paths).isFile() && paths.endsWith('.css') ){
              filesToBeAuditted.push(paths)
            }
        // invalid path/file
        } catch (error) {
          filesWithIssues.push(paths)
        }

      });

      if( ! filesToBeAuditted.length ){
        console.log('No file(s) or directory path(s) were given or default directory was not found.')
        console.log('Auditor did not execute.');
        return
      }

      let auditArgs = [
        colors ? '--colors' : '',
        important ? '--important' : '',
        displayNone ? '--display-none' : '',
        selectors ? '--selectors' : '',
        mediaQueries ? '--media-queries' : '',
        typography ? '--typography' : '',
      ].filter( e => e)
      
      if( propertyValues ){
        propertyValues.forEach((p) => {
          auditArgs.push(`--property-values=${p.replace(' ',',')}`)
        })
      }

      
      let { stdout, stderr } = spawn.sync( 
        'node ' + resolveBin('@caweb/cli', {executable: 'auditor'}),
        [
          ...filesToBeAuditted,
          ...auditArgs
        ],
        {
          stdio: 'pipe',
          cwd: fs.existsSync(path.join(process.cwd(), 'css-audit.config.cjs')) ? process.cwd() : currentPath
        }
      )

      if( stderr && ! stderr.toString() ){
        console.log( stderr.toString())
      }
      if( stdout ){
          let msg = stdout.toString().replace('undefined', '');
      
          if( 'audit' === process.argv[2] ){
              console.log( msg )
          }else{
              return msg;
          }

      }
      
    } // end of audit

} // end of class
  

export default CSSAuditPlugin;
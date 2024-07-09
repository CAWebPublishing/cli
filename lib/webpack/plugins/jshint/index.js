#!/usr/bin/env node

/**
 * External dependencies
 */
import spawn from 'cross-spawn';
import { getAllFilesSync } from 'get-all-files'
import EntryDependency from "webpack/lib/dependencies/EntryDependency.js";
import path from 'path';
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
      outputFilename: 'jshint',
      outputFolder: path.join(currentPath, 'public'),
    }

    constructor(opts = {}) {
      // outputFolder must be resolved
      if( opts.outputFolder ){
        opts.outputFolder = path.join(process.cwd(), opts.outputFolder);
      }
      this.config = deepmerge(this.config, opts);
    }

    apply(compiler) {
      const staticDir = {
        directory: this.config.outputFolder,
        watch: true
      }
      let { devServer } = compiler.options;
      let hostUrl = 'localhost' === devServer.host ? `http://${devServer.host}`: devServer.host;
      let hostPort = devServer.port;

      if( hostPort && 80 !== hostPort )
      {
          hostUrl = `${hostUrl}:${hostPort}`;
      }

      // if dev server allows for multiple pages to be opened
      // add jshint.html to open property.
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
      compiler.hooks.initialize.tap('JSHint Plugin', () => {
          compiler.hooks.compilation.tap(
            "JSHint Plugin",
            (compilation, { normalModuleFactory }) => {
              compilation.dependencyFactories.set(
                EntryDependency,
                normalModuleFactory
              );
            }
          );

		      const { entry, options, context } = {
            entry: path.join( this.config.outputFolder, 'jshint.update.js'),
            options: {
              name: 'jshint'
            },
            context: 'jshint'
          };

          const dep = new EntryDependency(entry);
          dep.loc = {
            name: options.name
          };
          
          if( ! fs.existsSync(path.resolve(this.config.outputFolder))){
            fs.mkdirSync( path.resolve(this.config.outputFolder), {recursive: true} );
          }
          
          fs.writeFileSync(
            path.join(this.config.outputFolder, `jshint.update.js`),
            `` // required for hot-update to compile on our page, blank script for now
          );


          compiler.hooks.thisCompilation.tap('JSHint Plugin',
            /**
             * Hook into the webpack compilation
             * @param {Compilation} compilation
             */
            (compilation) => {
              
              compiler.hooks.make.tapAsync("JSHint Plugin", (compilation, callback) => {
                
                compilation.addEntry(
                context,
                dep, 
                options, 
                err => {
                  callback(err);
                });
              });

              // process assets and run the jshint on appropriate assets.
              compilation.hooks.processAssets.tapAsync(
                {
                  name: 'JSHint Plugin',
                  stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL  
                },
                /**
                 * Hook into the process assets hook
                 * @param {any} _
                 * @param {(err?: Error) => void} callback
                 */
                (assets, callback) => {
                  let files = [];

                  Object.entries(assets).forEach(([pathname, source]) => {
                    if( pathname.endsWith('.js') ){
                      if( source['_source'] && source['_source']['_children'] ){
                        source['_source']['_children'].forEach((s, i) => {
                          if( 
                            'string' === typeof s && // is a string and
                            0 < s.indexOf('.js') && // has a .js reference and
                            0 > s.indexOf('node_modules') && // not referencing node_modules directory
                            0 > s.indexOf('jshint.update.js') // not referencing our update javascript
                          ){
                            files.push( path.resolve(s.replace(/[\n\s\S\w]*"(.*)"[\n\s\S\w]*/, '$1')) )
                          }
                        })    
                      }
                    }
                  })

                  console.log(`<i> ${boldGreen('[webpack-dev-middleware] Running JSHint...')}`);

                  this.hint(files, this.config);
                  
                  console.log(`<i> ${boldGreen('[webpack-dev-middleware] JSHint can be viewed at')} ${ boldBlue(new URL(`${hostUrl}/${this.config.outputFilename}.html`).toString())  }`);
                  
                  callback();
              });

                  
              compiler.hooks.watchClose.tap( 'JSHint Plugin', () => {
                getAllFilesSync(compiler.options.output.path).toArray().forEach(f => {
                  if( 
                    f.includes('jshint') || // delete any jshint files
                    f.includes('.hot-update.js') // delete any HMR files
                  ){
                    fs.rmSync(f)
                  }
                })
              })
          });

      });
      
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

                // get all .js files
                getAllFilesSync(resolvePath).toArray().forEach(f => {
                    if( f.endsWith('.js') ){
                      filesToBeAuditted.push(f)
                    }
                })
            // if given path is a file and a .js file
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

      let hintConfigFile = path.join(currentPath, '.jshintrc');

      /**
       * JSHint does not allow for multiple configs so we have to merge and write 1 file
       */
      if( fs.existsSync(path.join(process.cwd(), '.jshintrc')) ){
        let hintConfig = fs.readFileSync(hintConfigFile);
        let customConfig = fs.readFileSync(path.join(process.cwd(), '.jshintrc'));

        hintConfig = hintConfig.toString().replace(/[\r\t\n]|\/{2}.*/g, '')
        hintConfig = JSON.parse(hintConfig)

        customConfig = customConfig.toString().replace(/[\r\t\n]|\/{2}.*/g, '')
        customConfig = JSON.parse(customConfig)

        hintConfigFile = path.join(currentPath, '.customrc');
        fs.writeFileSync( 
          hintConfigFile , 
          JSON.stringify(deepmerge(hintConfig, customConfig), null, 4) 
        )
      }

      // Set the env for our reporter.
      process.env.JSHINT_OUTPUT_DIR = outputFolder;
      process.env.JSHINT_OUTPUT_FILENAME = outputFilename;

      let hintArgs = [
        '--config',
        hintConfigFile,
        '--reporter',
        path.join(currentPath, 'reporter.cjs')
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

      if( stderr && stderr.toString() ){
        console.log( stderr.toString())
      }

      if( stdout  ){
        if( 'jshint' === process.argv[2] && debug ){
          console.log( stdout.toString() );
        }else{
          return stdout.toString();
        }
      }else{
        console.log( 'No output generated.')
        return false;
      }
      
    } // end of hint

} // end of class
  

export default JSHintPlugin;
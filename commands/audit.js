#!/usr/bin/env node

/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import { getAllFiles, getAllFilesSync } from 'get-all-files'

/**
 * Internal dependencies
 */

import { 
    runCmd, 
    projectPath,
    appPath
} from '../lib/index.js';

/**
 * Run WordPress CSS Audit
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
export default async function audit({
	spinner,
	debug
} ) {
    
    let files = [];
    

    process.argv.slice(3).forEach( (paths, i) => {
        let resolvePath = path.resolve(paths);
        try {
            // if given path is a directory
            if( fs.statSync(resolvePath).isDirectory() ){
                // get all .css files
                getAllFilesSync(path.resolve(resolvePath)).toArray().forEach(f => {
                    if( f.endsWith('.css') ){
                        files.push(f)
                    }
                })
            // if given path is a file and a .css file
            }else if( fs.statSync(paths).isFile() && paths.endsWith('.css') ){
                files.push(paths)
            }
        // invalid path/file
        } catch (error) {

        }

    });
    
    // if no files were passed 
    if( ! files.length ){
        // if the default build directory exists we audit it
        if( fs.existsSync(path.resolve('build')) ){
            // get all .css files in build folder
            getAllFilesSync(path.resolve('build')).toArray().forEach(f => {
                if( f.endsWith('.css') ){
                    files.push(f)
                }
            })
        }
    }   

    // if files are to be audited.
    if( files.length ){
        let auditArgs = [
            ...files
        ];

        // default audits.
        let audits = [
            'colors',
            'alphas',
            'important',
            'display-none',
            'selectors',
            'media-queries',
            'typography',
            [ 'property-values', 'font-size' ],
            [ 'property-values', 'padding,padding-top,padding-bottom,padding-right,padding-left' ],
            [ 'property-values', 'margin,margin-top,marin-bottom,marin-right,marin-left' ]
        ]
        
        audits.forEach(a => {
            let audit = Array.isArray(a) ? a[0] : a;

            if( ! process.argv.includes(`--no-${audit}`) ){
                if( Array.isArray(a) ){
                    auditArgs.push(`--${audit}=` + a.splice(1).join(','))
                }else{
                    auditArgs.push(`--${audit}`)
                }
            }
        })
               
        const auditConfigPath = fs.existsSync(path.join(appPath, 'css-audit.config.cjs')) ? 
            appPath :
            path.join(projectPath, 'configs')


        await runCmd(
            'auditor', 
            auditArgs,
            {
                cwd: auditConfigPath
            }
        ).then(({stderr, stdout}) => {
            // Audit result handling.
            if( stderr ){
                console.log( stderr.toString())
            }
            if( stdout ){
                console.log( stdout.toString().replace('undefined') )
            }
        })
            
    }else{
        spinner.warn('No file(s) or directory path(s) were given.');
        spinner.warn('Default build directory was not found.');
        spinner.warn('Auditor did not execute.');
    }

};

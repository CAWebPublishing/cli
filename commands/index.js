/**
 * External dependencies
 */
// These are default wp-env commands. No need to overwrite these commands
import clean from '@wordpress/env/lib/commands/clean.js';
import logs from '@wordpress/env/lib/commands/logs.js';
import run from '@wordpress/env/lib/commands/run.js';
import stop from '@wordpress/env/lib/commands/stop.js';
import destroy from '@wordpress/env/lib/commands/destroy.js';
import installPath from '@wordpress/env/lib/commands/install-path.js';

/**
 * Internal dependencies
 */
import webpack from './webpack/webpack.js';

import CSSAuditPlugin from '@caweb/css-audit-webpack-plugin';
const audit = new CSSAuditPlugin().audit;

import JSHintPlugin from '@caweb/jshint-webpack-plugin';
const hint = new JSHintPlugin().hint;

import A11yPlugin from '@caweb/a11y-webpack-plugin';
const a11y = new A11yPlugin().a11yCheck;


import sync from './sync/index.js';

import createBlock from './blocks/create-block.js';
import updateBlock from './blocks/update-block.js';

import createSite from './sites/create-site.js';    
import convertSite from './sites/convert-site.js';

// These are wp-env commands
// we overwrite the start command so we can run additional steps.
import start from './env/start.js';
import shell from './env/shell.js';
import updatePlugins from './env/update-plugins.js';

// import test from './test.js';
import genScripts from './gen-scripts.js';

export {
    genScripts,
    a11y,
    audit,
    hint,
    webpack,
    clean,
    logs,
    run,
    installPath,
    start,
    stop,
    destroy,
    sync,
    updatePlugins,
    shell,
    createBlock,
    updateBlock,
    createSite,
    convertSite
}
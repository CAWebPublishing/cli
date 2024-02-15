/**
 * External dependencies
 */
/**
 * These are default wp-env commands. No need to overwrite these commands
 */
import clean from '@wordpress/env/lib/commands/clean.js';
import logs from '@wordpress/env/lib/commands/logs.js';
import run from '@wordpress/env/lib/commands/run.js';
import installPath from '@wordpress/env/lib/commands/install-path.js';

/**
 * Internal dependencies
 */
import build from './build.js';
import serve from './serve.js';
import a11y from './a11y.js';
import shell from './tasks/shell.js';

import sync from './sync.js';

import updatePlugins from './tasks/update-plugins.js'
import createBlock from './blocks/create-block.js'
import updateBlock from './blocks/update-block.js'

import test from './test.js';

/**
 * These are default wp-env commands, we overwrite these commands so we can run additional steps.
 */
import start from './env/start.js';
import destroy from './env/destroy.js';
import stop from './env/stop.js';

export {
    clean,
	logs,
	run,
	installPath,
    start,
	stop,
    destroy,
    build,
    serve,
    a11y,
    sync,
    updatePlugins,
    shell,
    createBlock,
    updateBlock,
    test
}
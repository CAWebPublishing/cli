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
import shell from './shell.js';
import updatePlugins from './tasks/update-plugins.js'

import test from './test.js';

/**
 * These are default wp-env commands, we overwrite these commands so we can run additional steps.
 */
import start from './start.js';
import destroy from './destroy.js';
import stop from './stop.js';


export {
	clean,
	logs,
	run,
	installPath,
	start,
	stop,
	destroy,
	test,
	shell,
	updatePlugins
}
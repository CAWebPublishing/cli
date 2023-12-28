/**
 * Modified from wp-env 
 * Few modifications made:
 * - Downloads CAWebPublishing Resources, excluding WordPress.
 * - Ensure  parent directory of source.path exists before attempting to extract in downloadZipSource, otherwise it will complain that file/directory doesn't exist.
 * @see @wordpress/env/lib/download-sources.js
 */

/**
 * External dependencies
 */
import util from 'util';
import path from 'path';
import fs from 'fs-extra';
import SimpleGit from 'simple-git';
import got from 'got';
import stream from 'stream';
import zip from 'extract-zip';
import rim from 'rimraf';

/**
 * Internal dependencies
 */

/**
 * Promisified dependencies
 */
const pipeline = util.promisify( stream.pipeline );
const extractZip = util.promisify( zip );
const rimraf = util.promisify( rim );

/**
 * Download CAWeb Resources.
 * 
 * @param {Object}   spinner The spinner object to show progress.
 * @return {WPConfig} The config object we've loaded.
 */
async function downloadSources( 
	{ 
		spinner,
		config
	}  
	) {
	const progresses = {};
	const getProgressSetter = ( id ) => ( progress ) => {
		progresses[ id ] = progress;
		spinner.text =
			`Downloading ${id}.\n` +
			Object.entries( progresses )
				.map(
					( [ key, value ] ) =>
						`  - ${ key }: ${ ( value * 100 ).toFixed( 0 ) }/100%`
				)
				.join( '\n' );
	};

	const { workDirectoryPath } = config;
	const { development: dev, tests: test } = config.env;

	let pluginDir = path.resolve(workDirectoryPath, 'plugins');
	let themeDir = path.resolve(workDirectoryPath, 'themes');

	let sources = dowloadPlugins(pluginDir);

	// Add Divi Theme and plugin to sources.
	if( (undefined !== dev.config.ET_USERNAME && 
		undefined !== dev.config.ET_API_KEY) || 
		(undefined !== test.config.ET_USERNAME && 
		undefined !== test.config.ET_API_KEY)
	){
		let url = 'https://www.elegantthemes.com/api/api_downloads.php';
		let user = undefined !== dev.config.ET_USERNAME ? dev.config.ET_USERNAME : test.config.ET_USERNAME;
		let key = undefined !== dev.config.ET_API_KEY ? dev.config.ET_API_KEY : test.config.ET_API_KEY;
		
		// Add Divi sources.
		sources = sources.concat( [
			{
				basename: 'Divi',
				url: `${url}?api_update=1&theme=Divi&api_key=${key}&username=${user}`,
				path: path.join(themeDir, 'Divi'),
				type: 'zip'
			},
			{
				basename: 'Divi Plugin',
				url: `${url}?api_update=1&theme=divi-builder&api_key=${key}&username=${user}`,
				path: path.join(pluginDir, 'divi-builder'),
				type: 'zip'
			}
		]);
	}

	// Ensure plugin/theme directory exists for downloading resources.
	fs.ensureDir(themeDir);
	fs.ensureDir(pluginDir);

	 await Promise.all(
		sources.map( ( source ) =>
			downloadSource( source, {
				onProgress: getProgressSetter( source.basename ),
				spinner,
			} )
		)
	);
	
};

/**
 * Downloads the given source if necessary. The specific action taken depends
 * on the source type. The source is downloaded to source.path.
 *
 * @param {WPSource} source             The source to download.
 * @param {Object}   options
 * @param {Function} options.onProgress A function called with download progress. Will be invoked with one argument: a number that ranges from 0 to 1 which indicates current download progress for this source.
 * @param {Object}   options.spinner    A CLI spinner which indicates progress.
 * @param {boolean}  options.debug      True if debug mode is enabled.
 */
async function downloadSource(src, { onProgress, spinner, debug } ){
    if( 'git' == src.type ){
        await downloadGitSource(src, { onProgress, spinner, debug });
    }else if( 'zip' == src.type ) {
        await downloadZipSource(src, { onProgress, spinner, debug });
    }
}

/**
 * Clones the git repository at `source.url` into `source.path`. If the
 * repository already exists, it is updated instead.
 *
 * @param {WPSource} source             The source to download.
 * @param {Object}   options
 * @param {Function} options.onProgress A function called with download progress. Will be invoked with one argument: a number that ranges from 0 to 1 which indicates current download progress for this source.
 * @param {Object}   options.spinner    A CLI spinner which indicates progress.
 * @param {boolean}  options.debug      True if debug mode is enabled.
 */
async function downloadGitSource( source, { onProgress, spinner, debug } ) {
	const log = debug
		? ( message ) => {
				spinner.info( `SimpleGit: ${ message }` );
				spinner.start();
		  }
		: () => {};
	onProgress( 0 );

	const progressHandler = ( { progress } ) => {
		onProgress( progress / 100 );
	};

	log( 'Cloning or getting the repo.' );
	const git = SimpleGit( { progress: progressHandler } );

	const isRepo =
		fs.existsSync( source.clonePath ) &&
		( await git.cwd( source.clonePath ).checkIsRepo( 'root' ) );

	// repository already exists.
	if ( isRepo ) {
		log( 'Repo already exists, using it.' );
	} else {
		// repository doesn't exists, but the directory does.
		if( fs.existsSync( source.clonePath ) ){
			// reinitialize repo.
			await git.cwd( source.clonePath );

			await git.init().addRemote('origin', source.url );
		}else{

			await git.clone( source.url, source.clonePath, {
				'--depth': '1',
				'--no-single-branch': null
			} );
			await git.cwd( source.clonePath );
		}
	}

	log( 'Fetching the specified ref.' );
	await git.fetch( 'origin', source.ref, {
		'--tags': null,
	} );

	log( 'Checking out the specified ref.' );
	await git.checkout( source.ref, {
		'--force': null
	});

	onProgress( 1 );
}

/**
 * Downloads and extracts the zip file at `source.url` into `source.path`.
 *
 * @param {WPSource} source             The source to download.
 * @param {Object}   options
 * @param {Function} options.onProgress A function called with download progress. Will be invoked with one argument: a number that ranges from 0 to 1 which indicates current download progress for this source.
 * @param {Object}   options.spinner    A CLI spinner which indicates progress.
 * @param {boolean}  options.debug      True if debug mode is enabled.
 */
async function downloadZipSource( source, { onProgress, spinner, debug } ) {
	const log = debug
		? ( message ) => {
				spinner.info( `NodeGit: ${ message }` );
				spinner.start();
		  }
		: () => {};
	onProgress( 0 );

	log( 'Downloading zip file.' );
	const zipName = `${ source.path }.zip`;
	const zipFile = fs.createWriteStream( zipName );
	const responseStream = got.stream( source.url );
	responseStream.on( 'downloadProgress', ( { percent } ) =>
		onProgress( percent )
	);

	await pipeline( responseStream, zipFile );

	log( 'Extracting to temporary directory.' );
    // Target directory is expected to be absolute.
	const tempDir = `${ source.path }.temp`;
	await extractZip( zipName, { dir: tempDir } );

	const files = (
		await Promise.all( [
			rimraf( zipName ),
			rimraf( source.path ),
			fs.promises.readdir( tempDir ),
		] )
	)[ 2 ];
	/**
	 * The plugin container is the extracted directory which is the direct parent
	 * of the contents of the plugin. It seems a zip file can have two fairly
	 * common approaches to where the content lives:
	 * 1. The .zip is the direct container of the files. So after extraction, the
	 *    extraction directory contains plugin contents.
	 * 2. The .zip contains a directory with the same name which is the container.
	 *    So after extraction, the extraction directory contains another directory.
	 *    That subdirectory is the actual container of the plugin contents.
	 *
	 * We support both situations with the following check.
	 */
	let pluginContainer = tempDir;
	const firstSubItem = path.join( tempDir, files[ 0 ] );
	if (
		files.length === 1 &&
		( await fs.promises.lstat( firstSubItem ) ).isDirectory()
	) {
		// In this case, only one sub directory exists, so use that as the container.
		pluginContainer = firstSubItem;
	}
	await fs.promises.rename( pluginContainer, source.path );
	await rimraf( tempDir );

	onProgress( 1 );
}

function dowloadPlugins(pluginDir){
	return [
		{
			basename: 'Design System',
			url: 'https://github.com/CA-CODE-Works/design-system-wordpress.git',
			ref: 'main',
			path: path.join(pluginDir, 'design-system-wordpress'),
			clonePath: path.join(pluginDir, 'design-system-wordpress'),
			type: 'git'
		},
		{
			basename: 'Query Monitor',
			url: 'https://downloads.wordpress.org/plugin/query-monitor.3.15.0.zip',
			path: path.join(pluginDir, 'query-monitor'),
			type: 'zip',

		}
	]
}

export {
	downloadSources
}
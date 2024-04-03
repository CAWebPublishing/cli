/**
 * External dependencies
 */
const { join } = require( 'path' );
const { capitalCase } = require( 'change-case' );

/**
 * Internal dependencies
 */
const blockSlug = process.argv[ 2 ];
const blockSlugTitle = capitalCase( blockSlug );

const customScripts = {};

const npmDependencies = [ 
	'@wordpress/icons@9.44.0' 
];

const npmDevDependencies = [
	'@wordpress/scripts@27.6.0'
];

// assetsPath: join( __dirname, 'assets' ),
module.exports = {
	pluginTemplatesPath: join( __dirname, 'plugin' ),
	blockTemplatesPath: join( __dirname, 'block' ),
	defaultValues: {
		pluginURI: `https://github.com/CAWebPublishing/${ blockSlug }`,
		plugin: true,
		description: `${ blockSlugTitle } Gutenberg Block`,
		version: '1.3.0',
		author: 'CAWebPublishing',
		license: 'GPL-2.0-or-later',
		licenseURI: 'https://www.gnu.org/licenses/gpl-2.0.html',
		namespace: 'caweb',
		category: 'cagov-design-system',
		textdomain: 'cagov-design-system',
		dashicon: 'format-aside',
		supports: {
			html: true,
		},
		attributes: {},
		example: {
			attributes: {}
		},
		customScripts: customScripts,
		npmDependencies: npmDependencies,
		npmDevDependencies: npmDevDependencies,
	},
};

/**
 * External dependencies
 */
const { join } = require( 'path' );

/**
 * Internal dependencies
 */
const blockSlug = process.argv[ 2 ];
const blockSlugTitle = blockSlug.charAt(0).toUpperCase() + blockSlug.substring(1);

const customScripts = {};

const npmDependencies = [ 
	'@wordpress/icons@10.12.0' 
];

const npmDevDependencies = [
	'@wordpress/scripts@30.5.1'
];

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
		viewScript: "file:./frontend.js",
		render: "file:./render.php"
	}
};

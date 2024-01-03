/**
 * External dependencies
 */
import path from 'node:path';
import fs from 'fs-extra';

import { CAWEB_OPTIONS, DIVI_OPTIONS } from './options.js';

/**
 * Generates the OVERRIDES.MD
 * 
 */
export default async function generateOverridesMD() {

	let output = [
		'## [.wp-env.override.json](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/#wp-env-override-json)',
		'Any fields here will take precedence over .wp-env.json.',
		'## <ins>Special Config Values</ins>',
	];

	// Generate CAWeb Options overrides.
	output.push('### <ins>CAWeb Options</ins>');
	for (const [key, option] of Object.entries(CAWEB_OPTIONS)) {
		output.push(`\`${key}\` - Updates CAWeb ${option.label}  `);
	}
	  
	// Generate Divi Options overrides.
	output.push('### <ins>Divi Options</ins>');
	for (const [group, options] of Object.entries(DIVI_OPTIONS)) {
		for (const [key, option] of Object.entries(options)) {
			output.push(`\`${key}\` - Updates CAWeb ${option.label}  `);
		}
	}

	await fs.writeFileSync(
		path.join(process.cwd(), 'docs', 'OVERRIDES.MD'),
		output.join('\n')
	);

};

#!/usr/bin/env node


/**
 * External dependencies
 */
import path from 'node:path';
import fs from 'fs';

import { CAWEB_OPTIONS, DIVI_OPTIONS } from '../../lib/index.js';
import cli from '../../lib/cli.js';


generateCommandsMD();
generateOverridesMD();


/**
 * Replace any characters that need to be encoded.
 *
 * @param {String} str Text to encode.
 * @returns {String}
 */
function encodedString(str){
	return str
		.replace('<','&lt;')
		.replace('>','&gt;')
		.replace(/\n/g, `  \n`)
}

/**
 * Generates the OVERRIDES.MD
 * 
 */
async function generateOverridesMD() {

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

	fs.writeFileSync(
		path.join(process.cwd(), 'docs', 'OVERRIDES.MD'),
		output.join('\n')
	);

};


async function generateCommandsMD() {

	let commands = []

	cli().commands.forEach( ( c ) => {
		commands[c.name()] = [
			`### \`caweb ${c.name()}\``,
			encodedString(c.description()),
			'<pre>',
			`<b>Usage:</b> caweb ${c.name()} ${encodedString(c.usage())}`
		]

		// Add arguments
		if( c.registeredArguments.length ){
			commands[c.name()].push('\n<b>Arguments:</b>')
			c.registeredArguments.forEach(( arg ) => {
				commands[c.name()].push( addOption( {...arg, flags: arg.name()} ) )
			})
		}

		// Add options
		if( c.options.length ){
			commands[c.name()].push('\n<b>Options:</b>')
			c.options.forEach(( opt ) => {
				commands[c.name()].push( addOption( opt ) )
			})
		}

		commands[c.name()].push('</pre>')
	})

	// Sort commands
	commands = Object.keys(commands).sort().reduce((temp, key) => {
		temp = [].concat(temp, commands[key]);

		return temp;
	}, [])
	
	fs.writeFileSync(
		path.join(process.cwd(), 'docs', 'COMMANDS.MD'),
		['## Command Reference', ...commands].join('\n')
	);

};

function addOption({
	flags,
	description,
	defaultValue,
	argChoices
}){
	const minPadding = 35;
	let padding = minPadding +
		(flags.includes('<') ? 3 : 0) +
		(flags.includes('>') ? 3 : 0);

	flags = encodedString(flags);

	let output = `${flags.padEnd(padding, ' ')}${encodedString(description)}`;

	// Add Default Value 
	if( undefined !== defaultValue ){
		output = `${output}\n${' '.repeat(minPadding) }Default: ${defaultValue}`
	}
	
	// Add Choices
	if( undefined !== argChoices ){
		output = `${output}\n${' '.repeat(minPadding) }Choices: ${argChoices}`
	}

	return output;
}

export default generateOverridesMD; 
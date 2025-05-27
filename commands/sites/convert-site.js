/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { HTMLToJSON } from 'html-to-json-parser';
import jsdom from 'jsdom';
import { parse } from 'node-html-parser';

/**
 * Internal dependencies
 */
import { appPath, writeLine } from '../../lib/index.js';

import {
	promptForGeneralInfo,
	promptForSocial,
	promptForGoogleOptions,
	promptForAlerts,
	promptForHeader,
	promptForFooter
} from './prompts.js';

/**
 * Constants used during the conversion process.
 */
/**
 * Modules allow list
 */
const allowedModules = {
	'et_pb_text': ['p', 'span', 'a', 'b'],
	'et_pb_heading': ['span', 'a', 'b']
}


/**
 * Returns the limiter character based on the type.
 * 
 * @param {string} type Choices are 'angle', 'bracket' or 'none. Default is 'angle'.
 * @returns {object}
 */
function getLimiter( type ) {
	let limiter = {
		open: '<',
		close: '>'
	}
	if ('bracket' === type ) {
		limiter.open = '[';
		limiter.close = ']';
	}else if ('none' === type ) {
		limiter.open = '';
		limiter.close = '';
	}

	return limiter;
}

function findElementByClass(node, search ) {
		let found = false;

		node.forEach( n => {
			let classes = n.classList ? [...n.classList.values()] : [];

			if( classes.includes(search) ) {
				// we found the element we are looking for
				// we want to return the element
				found = n.childNodes[0].toString();
			}else{
				found = findElementByClass(n.childNodes, search);
			}
		});

		return found;
}

function findSiblingElement(node, search) {
	let found  = false;
		node.forEach( n => {
			if( search === n.rawTagName ) {
				// we found the element we are looking for
				// we want to return the element
				found = n;
			}
		});

		return found;
}

/**
 * This function is used to sanitize the JSON data.
 * 
 * @param {object} json The JSON data to sanitize.
 * 
 * @returns {object} The sanitized JSON data.
 */
function sanitizeJson(json){
	for( const j in json ) {
		let obj = json[j];

		// we want to iterate over the content of the json object
		// if the value is content
		// if the content is an object, we want to recursively sanitize it
		if( obj.childNodes ) {
			sanitizeJson( obj.childNodes );
			obj.childNodes = obj.childNodes.filter( c => c );
		}

		// blank tag names indicate text nodes
		if( '' === obj.rawTagName  ) {
			// blank lines are not needed
			if(  obj['_rawText'] && '' === obj['_rawText'].trim() ){
				delete json[j];
			}else{
				// this will remove all new lines and double spacing
				// this might also remove formatting. Need to test more
				json[j]['_rawText'] = obj['_rawText'].replace(/([\n\r]|\s{2,})/g, '')
			}
		}

		
	}

	return json;
}

/**
 * Converts the string attributes to a json object. Used when parsing attributes from the html
 * 
 * @param {string} rawAttrs Raw attribute string to convert.
 * @returns {object} The converted attributes.
 */
function convertRawAttrs( rawAttrs ) {
	if( ! rawAttrs || 'string' !== typeof rawAttrs ) {
		return {};
	}

	let attrs = {};

	// attributes follow the format of key="value" key="value"
	// we want to split the string by "space
	let attrArray = rawAttrs.split( '" ' );

	attrArray.forEach( (a) => {
		let key = a.split( '=' )[0].trim();
		let value = a.split( '=' )[1].replace(/"/g, '').trim();

		if( attrs[key] ) {
			attrs[key] += ` ${value}`;
		}else{
			attrs[key] = value;
		}
	});

	return attrs;
	
}

/**
 * Converts attributes from json object to a string. Used when generating shortcodes.
 * 
 * @param {*} attributes 
 * @returns 
 */
function getAttrString(attributes, limiter) {
		let attrString = '';
		for( let key in attributes ) {
			if( attributes[key] ) {
				let value = 'object' === typeof attributes[key] ? 
					JSON.stringify( attributes[key] ): attributes[key].trim();

				if( 'bracket' === limiter ) {
					// divi uses shortcode with different attributes
					switch( key ) {
						case 'class':
							key = 'module_class';
							break;
						case 'id':
							key = 'module_id';
							break;
						case 'style':
							key = [];

							value.split(';').forEach( (v) => {
								let k = v.split(':')[0].trim();
								let s = v.split(':')[1].trim();

								// style mappings
								switch( k ) {
									case 'background-image':
										k = 'background_image';
										s = s.replace(/url\((.*?)\).*/g, '$1').replace(/["']/g, '');	
										break;

									case 'background-repeat':
										k = 'background_position';
										s = s.replace(/(.*?)(repeat|no-repeat)/g, '$2');
										break;
									default:
										k = '';
										break;
								}

								if( k ) {
									key.push(`${k}="${s}"`);
								}
							});
							break;
						
					}
				}

				if( '' !== key && 'string' === typeof key ) {
					attrString += ` ${key}="${value}"`;
				}else if( 'object' === typeof key ) {
					attrString += ` ${key.join(' ')}`;
				}
			}
		}

		return attrString;
}

/**
 * Generates an html element string.
 *
 * @param {string} tag 
 * @param {object} opts
 * @param {object} opts.attrs The attributes to add to the element.
 * @param {string} opts.content The content to add to the element.
 * @param {string} opts.limiter The type of limiter to use. Choices are 'angle' or 'bracket'.	
 * @param {boolean} opts.isUnclosed True if the element is unclosed. Defaults to false.
 * @param {boolean} opts.isSelfClosing True if the element is self closing. Defaults to false.
 * @param {boolean} opts.closing True if the element is closing. Defaults to false. 
 * @returns {string} 
 */
function addElement( tag, opts = {} ) {
	let defaultOpts = {
		attrs : {},
		content: '', 
		limiter: 'angle', 
		isUnclosed: false, 
		isSelfClosing: false,
		closing: false
	}

	let { attrs, content, limiter, isUnclosed, isSelfClosing } = {...defaultOpts, ...opts};


	let lmtrObj = getLimiter( limiter );
	
	// generate attribute string
	let attrString = getAttrString( attrs, limiter );

	// if the tag is empty, we want to return the content
	if( ! tag ) {
		return content;	
	}

	let output = `${lmtrObj.open}${tag}${attrString}${tag && isSelfClosing ? ' /' : ''}${lmtrObj.close}${content.trim()}`
	
	if( ! isUnclosed && ! isSelfClosing && tag) {
		output += closeElement(tag, lmtrObj );
	}

	return output;	
}

/**
 * Closes an element.
 * 
 * @param {string} tag The tag to close.
 * @param {object} limiter The type of limiter character.
 */
function closeElement( tag, limiter ) {
	let lmtrObj = 'string' === typeof limiter ? getLimiter( limiter ) : limiter;
	return `${lmtrObj.open}/${tag}${lmtrObj.close}`
}

/**
 * Generates shortcodes from the json object.
 * Converts a json dom object into shortcodes.
 * 
 * 
 * @param {array[object]} mainContent Array of json objects to convert.
 * @param {object} opts Json object of configurations used during the conversion process.
 * @param {string} opts.limiter The type of limiter to use. Choices are 'angle' or 'bracket'.
 * @param {boolean} opts.openElement Current opened element. Defaults to false.
 * @param {boolean} opts.inFullwidth True if the element is in a fullwidth section. Defaults to false.
 * @param {boolean} opts.inSection True if the element is in a section. Defaults to false.
 * @param {boolean} opts.inRow True if the element is in a row. Defaults to false.
 * @param {boolean} opts.inColumn True if the element is in a column. Defaults to false.
 * @param {number} opts.columnCount The number of columns in the row. Defaults to 0.
 * @returns 
 */
function generateShortcodes( mainContent,  opts = {
		openElement: false, 
		limiter: 'bracket',
		inFullwidth: false,
		inSection: false,
		inRow: false,
		inColumn: false,
		columnCount: 0,
	}) {
	const setFullwidthTag = ( value, fullwidth ) => {
		return fullwidth ? value.replace('et_pb_', 'et_pb_fullwidth_') : value;	
	}

	let output = '';
	
	for( const element in mainContent ) {
		let htmlElement = mainContent[element];

		let {
			rawTagName: type, 
			rawAttrs,
			childNodes: content,
			classList,
		} = htmlElement;

		// classList returns a DOMTokenList, we need to convert it to an array
		let classes = classList ? [...classList.values()] : [];

		// we convert the raw attributes to a json object
		let attrs = convertRawAttrs( rawAttrs );

		/**
		 * We dont want to convert empty elements
		 */
		if( ! content.length ){
			// image tags are self closing and don't have content this is ok.
			if( 'img' === type ) {
				// do nothing this is ok.
			// no length no type blank spaces
			} else if( '' !== type ){
				continue;
			}
		}

		/**
		 * Important:
		 * If there is an open module and the current type isn't allowed in the module we must close the open module first
		 */
		if( type && opts.openElement  ) {
			// if openElement has restrictions
			if( 
				allowedModules[opts.openElement] &&  
				! allowedModules[opts.openElement].includes(type)
			) {
				output += closeElement(opts.openElement, opts.limiter );
				opts.openElement = false;
			}
		}

		// element type rendering
		switch( type ) {
			case 'div':
				// .container-fluid primarily used for fullwidth sections
				if( classes.includes('container-fluid') && ! opts.inFullwidth) {
					opts.inFullwidth = true;

					let hasContainers = content.filter((r,i) => { 
						if(r.attributes.class.match(/container/g)){
							// we add the raw attributes to the containers
							// this allows the sections to use the fluid attributes
							// we do remove the container-fluid class
							r.rawAttrs = r.rawAttrs + ` ${rawAttrs.replace('container-fluid', '')}`;
							return true;
						}
					}).length

					if( ! hasContainers ) {
						output += addElement(
							'et_pb_fullwidth_section', 
							{ 
								limiter:opts.limiter, 
								content: generateShortcodes(content, opts) 
							}
						);
					}else{
						opts.inFullwidth = false;

						output += addElement(
							'', 
							{ 
								content: generateShortcodes(content, opts) 
							}
						);

					}
					
					
					opts.inFullwidth = false;

				// .container is used primarily for regular sections
				}else if( classes.includes('container') && ! opts.inSection ) {
					opts.inSection = true;

					// sections don't need the container class
					// we remove the container class from the attributes
					attrs.class = attrs.class.replace('container', '');

					output += addElement( 
						'et_pb_section', 
						{ 
							limiter:opts.limiter, 
							content: generateShortcodes(content, opts),
							attrs 
						}
					);
					
					opts.inSection = false;

				// .row is used for rows
				}else if( classes.includes('row') && ! opts.inRow ) {
					opts.inRow = true;
					// if the div has a class of row, we want to get the total number of columns
					opts.columnCount = content.filter((r,i) => r.attributes?.class?.match(/(col)[-\w\d]*/g) ).length;

					// sections don't need the row class
					// we remove the row class from the attributes
					attrs.class = attrs.class.replace('row', '');

					output += addElement(
						'et_pb_row', 
						{ 
							limiter: opts.limiter, 
							content: generateShortcodes(content, opts) 
						}
					);
					
					// reset the column count
					opts.columnCount = 0;
					opts.inRow = false;
				
				// columns
				}else if( classes.filter(c => c.match( /(col)[-\w\d]*/g )).length && ! opts.inColumn ) {	
					opts.inColumn = true;

					/**
					 * if the div has multiple column classes only the first one after being sorted is used
					 * 
					 * Example:
					 * <div class="col-md-4 col-lg-3 col"></div>
					 * 
					 * Sorted:
					 * - col
					 * - col-lg-3
					 * - col-md-4
					 * 
					 * Just col would be used
					 */
					let colClass = classes.filter(c => c.match( /(col)[-\w\d]*/g )).sort()[0];
					let colSize = Number(colClass.split( '-' ).pop());

					// if the colSize is not a number, we want to set it to 12, 
					// 12 is the max number for bootstrap columns
					colSize = ! isNaN(Number( colSize )) ? colSize : 12 / opts.columnCount;

					let colType = '';
					// calculate the column type
					switch( colSize ) {
						// 1 column
						case 12:
							colType = '4_4';
							break;
						// 2 columns
						case 6:
							colType = '1_2';
							break;
						// 3 columns	
						case 4:
							colType = '1_3';
							break;
					}

					// columns don't need the col class
					// we remove the col class from the attributes
					attrs.class = attrs.class.replace(/(col)[-\w\d]*/g, '');


					// if the div has a class of col, we want to convert it to a shortcode
					opts.openElement = 'et_pb_column';

					// we don't close the column here
					output += addElement(
						opts.openElement, 
						{ 
							limiter: opts.limiter, 
							isUnclosed: true,
							attrs: {
								...attrs,
								type: colType 
							},  
							content: generateShortcodes(content, opts) 
						}
					);

					// we have to close any open elements before closing the column
					if( opts.openElement && 'et_pb_column' !== opts.openElement ) {
						output += closeElement(opts.openElement, opts.limiter );
						opts.openElement = false;
					}

					// now we can close the column
					output += closeElement('et_pb_column', opts.limiter );

					opts.inColumn = false;
				}else{
					// fullwidth sections only allow specific elements
					// divs are not allowed
					if( opts.inFullwidth ) {
						// output += addElement('', { limiter: 'none', content: generateShortcodes(content) });
					}else{
						if( classes.includes('card') && classes.includes('blurb') ){
							// this is a blurb module
							output += generateModuleShortcode('blurb', content);
							
						}else{
							// figure out what kind of div element we are dealing with	
							output += addElement(
								type, 
								{ 
									limiter: opts.limiter, 
									content: generateShortcodes(content, opts) 
								}
							);

						}
					}
				}

				break;

			// code module
			case 'code':
				output += addElement(setFullwidthTag('et_pb_code', opts.inFullwidth), {attrs, limiter: 'bracket', content: generateShortcodes(content)} );
				break;
			// header modules
			case 'h1':
			case 'h2':
			case 'h3':
			case 'h4':
			case 'h5':
			case 'h6':
				// we let the h1-h6 process know element is opened
				// this allows other elements to be added to the header modules
				opts.openElement = 'et_pb_heading';

				output += addElement(
					opts.openElement, 
					{
						limiter: opts.limiter, 
						content: generateShortcodes(content, opts)
					}
				);

				opts.openElement = false;
				break;
			
			case 'img':
				output += addElement(
					'et_pb_image', 
					{
						limiter: opts.limiter, 
						attrs, 
						isSelfClosing: true
					} 
				);

				break;
			// all theses elements can go in a text module
			case 'a':
			case 'b':
			case 'p':
			case 'span':
				
				if( opts.inFullwidth ) {
					// figure out what to do with these elements if in a fullwidth section

				// these elements get added to a text module
				}else{
					// if not already opened
					if( ! opts.openElement ) {
						opts.openElement = 'et_pb_text';

						// this allows other elements to be added to the text modules
						// render the text module by adding and element to an element
						output += addElement(
							opts.openElement, 
							{
								limiter: opts.limiter, 
								isUnclosed: true, 
								content: addElement(
									type, 
									{
										attrs, 
										content: generateShortcodes(content, opts)
									}
								),
							} 
						);


					// a text module has already been opened so we just add to it
					}else {
						output += addElement(
							type, {
								attrs, 
								content: generateShortcodes(content, opts)
							} 
						);
					}
				}

				break;
			// default is a string element
			default:
				// console.log( htmlElement)
				output += htmlElement; 
				break;
				
		}

		
	}

	return output;
}

function generateModuleShortcode(module, content ){

	switch( module ) {
		case 'blurb':
			// blurb module
			let attrs = {
				title: findElementByClass(content, 'card-title'),
			};

			let img =  findSiblingElement(content, 'img');
			
			if( img ){
				let imgAttrs = convertRawAttrs( img.rawAttrs );
				attrs.image = imgAttrs.src
			}

			return addElement(
				'et_pb_blurb', 
				{
					limiter: 'bracket', 
					attrs
				}
			);
	}
}

/**
 * Attempts to convert a site.
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 * @param {boolean} options.builder   Editor style to use for the pages. Choices are 'plain', 'divi', or 'gutenberg'.
 */
export default async function convertSite({
	spinner,
	debug} ) {
		spinner.stop();
		
		// let buildPath = path.join( appPath, 'content' );
		let buildPath = path.join( appPath, 'build' );

		/**
		 * Return all .htlm files in the build directory
		 * 
		 * exclusions:
		 * - serp.html - This a search engine results page, we don't need to parse this
		 */
		let sitePages = fs.readdirSync( buildPath, { recursive: true } ).filter( file => {
			return 'serp.html' !== file && file.endsWith( '.html' )
		} );

		for( const file of sitePages ) {
			// get the file path
			let filePath = path.join( buildPath, file );
			let fileMarkup = fs.readFileSync( filePath, 'utf8' );
			
			// We use jsdom to emulate a browser environment and get the window.document
			let fileMarkupJSon = await jsdom.JSDOM.fromFile( filePath );
			let { document } = fileMarkupJSon.window;

			// all we need is the document #page-container #main-content
			let mainContent = document.querySelector( '#page-container #main-content' );
			
			// if the default #page-container #main-content exists
			if( mainContent ){
				// use html-to-json-parser to convert the page container into json
				// let mainContentJson =  await HTMLToJSON( mainContent.outerHTML, false );
				let mainContentJson =  parse( mainContent.outerHTML );
			
				// sanitize the json
				mainContentJson = sanitizeJson( mainContentJson.childNodes )[0];
				/**
				 * Main content is allowed 2 elements 
				 * - main - renders the main content
				 * - aside - renders the sidebar content
				 */
				mainContent = mainContentJson.childNodes.filter( e => 'main' === e.rawTagName )[0];

				// if main content was found
				if( mainContent && mainContent.childNodes ) {
					let shortcodeContent = '';
					// loop through the main content and convert it to shortcodes
					// main-content should only have 1 element, div
					// .container for regular sections
					// .container-fluid for fullwidth sections
					for( const e in mainContent.childNodes ) {
						shortcodeContent += generateShortcodes( [mainContent.childNodes[e]] );
					}

					console.log( `shortcodeContent: ${shortcodeContent}` );
				}

				
			}

		}

		return
		let siteData = {};

		// check if the site data file exists
		if( fs.existsSync( filePath ) ) {
			let file = fs.readFileSync( filePath, 'utf8' );
			let data = JSON.parse( file );

			// check if the data file has site data
			if( data.site ) {
				const continueProcess = await confirm(
					{ 
						message: `Site data already exists, existing data will be overwritten.\nWould you like to continue?`,
						default: true
					},
					{
						clearPromptOnDone: true,
					}
				).catch(() => {process.exit(1);});

				// if the user wants to continue, set the site data
				// otherwise exit the process
				if( continueProcess ){
					siteData = data.site;
				}else{
					spinner.fail( 'Site creation cancelled.' );
					process.exit( 0 );
				}
			}
		}

		writeLine('CAWebPublishing Site Creation Process', {char: '#', borderColor: 'green'});
		writeLine('This process will create a site configuration file for CAWebPublishing.', {color: 'cyan', prefix: 'i'});
		writeLine('Please answer the following questions to create your site configuration file.', {color: 'cyan', prefix: 'i'});
		writeLine('You can skip any question by pressing enter.', {color: 'cyan', prefix: 'i'});
		writeLine('You can also edit the configuration file later.', {color: 'cyan', prefix: 'i'});

		// populate the site data
		siteData = {
			...await promptForGeneralInfo(siteTitle),
			header: await promptForHeader(),
			alerts: await promptForAlerts(),
			social: await promptForSocial(),
			google: await promptForGoogleOptions(),
			footer: await promptForFooter(),
		};

		// write the site data to the file
		fs.writeFileSync(
			path.join( appPath, 'caweb.json' ),
			JSON.stringify( {site:siteData}, null, 4 )
		);

		writeLine('CAWebPublishing Site Creation Process Complete', {char: '#', borderColor: 'green'});
		writeLine('You can now start the site by running the following command:', {color: 'cyan', prefix: 'i'});
		writeLine(`npm run caweb serve`, {color: 'cyan', prefix: 'i'});

		spinner.start('CAWebPublishing Site Configuration file saved.');
		
};

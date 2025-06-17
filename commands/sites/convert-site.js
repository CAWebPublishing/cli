/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import jsdom from 'jsdom';
import { parse } from 'node-html-parser';

/**
 * Internal dependencies
 */
import { appPath, projectPath, writeLine } from '../../lib/index.js';

import validatePage from './validation.js';

/**
 * Constants used during the conversion process.
 */
const { DIVI_VER } = JSON.parse( fs.readFileSync( path.join(projectPath, 'package.json') ) ).config;

/**
 * Modules allow list
 */
const commonElements = ['div', 'a', 'b', 'p', 'br', 'span', 'strong', 'ul', 'ol', 'li'];


const allowedModules = {
	'et_pb_text': [...commonElements, 'code'],
	'et_pb_heading': ['span', 'a', 'b'],
	'et_pb_code': commonElements,
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

	// attributes follow the format of key="value"
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

							value.split(';').filter(Boolean).forEach( (v) => {

								let k = v.split(':')[0].trim();
								let s = v.split(':')[1].trim();

								// style mappings
								switch( k ) {
									case 'background-color':
										k = 'background_color';
										break;
									case 'background-image':
										k = 'background_image';

										let gradient = s.replace(/.*[,\s]*linear-gradient\((.*?)\).*/g, '$1').replace(/["']/g, '');

										if( gradient ) {
											// if the gradient is present we want to add the appropriate values
											let gradientValues = gradient.split(',');

											key.push(`background_color_gradient_direction="${gradientValues[0].trim()}"`);
											key.push(`background_color_gradient_stops="${gradientValues.slice(1).join('|')}"`);
											key.push('use_background_color_gradient="on"');
										}

										s = s.replace(/url\((.*?)\).*/g, '$1').replace(/["']/g, '');
										break;

									case 'background-repeat':
										k = 'background_repeat';
										s = s.replace(/(.*?)(repeat|no-repeat)/g, '$2');
										break;
									
									case 'background-position':
										k = 'background_position';
										/**
										 * position can be 4 different syntaxes so lets split the values
										 * @link https://developer.mozilla.org/en-US/docs/Web/CSS/background-position
										 */
										let values = s.split(' ');
										// for whatever reason Divi has these values inverted
										
										switch( values.length ) {
											case 1:
												s = values[0];
												break;
											case 2:
												s = `${values[1]}_${values[0]}`;
												break;
											case 3:
											case 4:
												s = `${values[2]}_${values[0]}`;
												break;
										}
										break;
									
									case 'background-size':
										k = 'background_size';
										
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
					// we have to encode certain characters
					value = value.replaceAll('"', '%22');

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

	content = content.trim();

	let output = `${lmtrObj.open}${tag}${attrString}${tag && isSelfClosing ? ' /' : ''}${lmtrObj.close}${content}`
	
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
			// image tags and br are self closing and don't have content this is ok.
			if( ['img', 'br'].includes( type ) ) {
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

					// fullwidth sections don't need the container-fluid class
					// we remove the container-fluid class from the attributes
					attrs.class = attrs.class.replace('container-fluid', '');

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
							'et_pb_section', 
							{ 
								limiter:opts.limiter, 
								content: generateShortcodes(content, opts),
								attrs: {
									_builder_version: DIVI_VER,
									fullwidth: 'on',
									inner_width: 'auto',
									inner_max_width: '1080px',
									...attrs,
								}
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
							attrs: {
								_builder_version: DIVI_VER,
								...attrs,
							}
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
						// 1/4 columns	
						case 3:
							colType = '1_4';
							break;
						// 1/3 columns	
						case 4:
							colType = '1_3';
							break;
						// 1/2 columns
						case 6:
							colType = '1_2';
							break;
						// 2/3 columns
						case 8:
							colType = '2_3';
							break;
						// 3/4 column
						case 9:
							colType = '3_4';
							break;
						// 1 column
						case 12:
							colType = '4_4';
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
						if( classes.includes('card') ){
							// this is Divi blurb module
							if( classes.includes('blurb') ) {
								output += generateModuleShortcode('blurb', htmlElement );
							}else{
								// this is our card module
								output += generateModuleShortcode('ca_card', htmlElement );
							}
							
						}else{
							// figure out what kind of div element we are dealing with	
							output += addElement(
								type, 
								{ 
									limiter: 'angle', 
									content: generateShortcodes(content, opts),
									attrs
								}
							);

						}
					}
				}

				break;

			// code module
			case 'code':
				// if already opened
				let codeElement = 'et_pb_column' === opts.openElement  ? 
					setFullwidthTag('et_pb_code', opts.inFullwidth) :
					'code'  

					output += addElement(
						codeElement, 
						{
							attrs, limiter: 'code' === codeElement ? 'angle' : 'bracket', 
							content: generateShortcodes(content, opts)
						} );
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
				// opts.openElement = 'et_pb_heading';

				output += generateModuleShortcode('heading', htmlElement);
				// opts.openElement = false;
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
			// all theses elements can go in other modules
			// they also need to be added to the allowedModules list
			case 'a':
			case 'b':
			case 'p':
			case 'ol':
			case 'ul':
			case 'li':
			case 'span':
			case 'strong':
				
				if( opts.inFullwidth ) {
					// figure out what to do with these elements if in a fullwidth section

				// these elements get added to a text module
				}else{
					// if not already opened
					// or the last opened element is a column
					if( ! opts.openElement || 'et_pb_column' === opts.openElement ) {
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
				output += htmlElement; 
				break;
				
		}

		
	}

	return output;
}

/**
 * Bootstraps to Object conversion process.
 * 
 * @param {*} classes 
 * @param {*} styles 
 * @returns {object}
 */
function bsToProp(classes, styles = {}) {
	let props = {};

	let fontWeight = {
		lighter: '200',
		light: '300',
		normal: '400',
		medium: '500',
		semibold: '600',
		bold: '700',
		extrabold: '800',
	}
	let fontColors = {
		'light': 'ededef',
		'dark': '3b3a48',
		'white': 'fff',
		'black': '000',
	}
	let alignments = {
		'left': 'left',
		'center': 'center',
		'right': 'right',
	}

	for( const c of classes.values() ) {
		if( c.startsWith('fw-') ) {
			let fontWeightValue = c.replace('fw-', '');
			props.font_weight = fontWeight[fontWeightValue] || fontWeight.normal;
			classes.remove(c);
		}

		if( c.startsWith('text-') ) {
			let textUtil = c.replace('text-', '');
			// text orientation
			if( alignments[textUtil] ){
				props.text_orientation = alignments[textUtil];
				classes.remove(c);
			}

			// text color
			if( fontColors[textUtil] ) {
				props.font_color = fontColors[textUtil];
				classes.remove(c);
			}

		}
	}

	if( styles && styles.length ) {
		styles.split(';').filter(Boolean).forEach( (v) => {
			let k = v.split(':')[0].trim();
			let s = v.split(':')[1].trim();
			// style mappings
			switch( k ) {
				case 'background-color':
					props.background_color = s;
				case 'background-image':
					let gradient = s.replace(/.*[,\s]*linear-gradient\((.*?)\).*/g, '$1').replace(/["']/g, '');

					if( gradient ) {
						// if the gradient is present we want to add the appropriate values
						let gradientValues = gradient.split(',');

						props.background_color_gradient_direction = gradientValues[0].trim();
						props.background_color_gradient_stops = gradientValues.slice(1).join('|');
						props.use_background_color_gradient = 'on';
					}

					props.background_image = s.replace(/url\((.*?)\).*/g, '$1').replace(/["']/g, '');
				break;
				case 'background-repeat':
					props.background_repeat = s.replace(/(.*?)(repeat|no-repeat)/g, '$2');
				break;
				case 'background-position':
					/**
					 * position can be 4 different syntaxes so lets split the values
					 * @link https://developer.mozilla.org/en-US/docs/Web/CSS/background-position
					 */
					let values = s.split(' ');
					// for whatever reason Divi has these values inverted
				
					switch( values.length ) {
						case 1:
							s = values[0];
							break;
						case 2:
							s = `${values[1]}_${values[0]}`;
							break;
						case 3:
						case 4:
							s = `${values[2]}_${values[0]}`;
						break;
					}
					props.background_position = s;
				break;
				case 'background-size':
					props.background_size = s;
				case 'color':
					props.font_color = s;
				break;
			}
		});
	}
	
	return props;
}

/**
 * Generates a Divi module shortcode from the module name and element.
 * 
 * @param {*} module 
 * @param {*} element 
 * @returns 
 */
function generateModuleShortcode(module, element  ){
	let content = '';
	let attrs = {};
	let moduleName = 'et_pb_' + module;

	switch( module ) {
		case 'blurb': {
			/**
			 * if blurb module is requested
			 * we try and make the shortcode as if the element
			 * was made with a Card Component
			 */

			let header = element.querySelector('.card-header');
			let title = element.querySelector('.card-title');
			let img = element.children.filter( c => c.tagName.toLowerCase() === 'img' );
			
			content = element.querySelector('.card-body');

			// the link_option_url is determined by either the 
			// .card-header options link or the .card-title data-url
			// .card-header will take precedence over the .card-title
			if( header && header.querySelector('.options a') ) {
				let link = header.querySelector('.options a');
				attrs.link_option_url = link.getAttribute('href');
			}

			// if the element has a .card-title, we want to add it to the attributes
			if( title ) {
				attrs.title = title.text.trim();

				// if the link_option_url is not set, we want to set it to the title's data-url
				if( ! attrs.link_option_url && title.getAttribute('data-url') ) {
					attrs.link_option_url = title.getAttribute('data-url');
				}

				// text orientation
				attrs.text_orientation = 'left';

				if( title.classList.contains('text-center') ){
					attrs.text_orientation = 'center';
				}else if( title.classList.contains('text-right') ){
					attrs.text_orientation = 'right';
				}

				// remove the .card-title from the content
				title.remove();
			}
			
			// if the element has an image, we want to add it to the attributes
			if( img ){
				attrs.image = img[0].getAttribute('src')
			}

			// if the element has a .card-body
			if( content ){
				// if the content has a class of text-light,
				if(content.classList.contains('text-light')){
					attrs.background_color = 'light';
				
					// background_layout opposite background_color 
					attrs.background_layout = 'dark';
				}else{

					attrs.background_color = 'dark';
				
					// background_layout opposite background_color 
					attrs.background_layout = 'light';
				}

				content = content.innerHTML.trim();
			}

			// remove the card layout class from class list
			element.classList.remove('card');
			element.classList.remove('blurb');
			element.classList.remove('bg-transparent');
			for( const c of element.classList.values() ) {
				if( c.startsWith('card-') ) {
					element.classList.remove(c);
				}
			}
			break;
		}
		case 'ca_card': {
			/**
			 * if card module is requested
			 */
			let header = element.querySelector('.card-header');
			let title = element.querySelector('.card-title');
			let img = element.children.filter( c => c.tagName.toLowerCase() === 'img' );
			let layout = element.classList.toString().match(/card-(\w+)/g)[0].replace('card-', '');

			content = element.querySelector('.card-body');

			// card layout
			attrs.card_layout = layout || 'default';

			// .card-header
			if( header ) {
				// the link_option_url is determined by either the 
				// .card-header options link or the .card-title data-url
				if( header.querySelector('.options a') ){
					let link = header.querySelector('.options a');

					attrs.show_button = 'on';
					attrs.button_link = link.getAttribute('href');
				}

				attrs.include_header = 'on';
				attrs.title = header.text.trim();

			}
			
			// if the element has a .card-title
			if( title ) {

				// if the link_option_url is not set, we want to set it to the title's data-url
				if( ! attrs.link_option_url && title.getAttribute('data-url') ) {
					
					attrs.show_button = 'on';
					attrs.button_link = link.getAttribute('href');
				}
			}

			// if the element has an image, we want to add it to the attributes
			if( img && img.length ) {
				attrs.show_image = 'on';
				attrs.featured_image = img[0].getAttribute('src');
			}

			// if the element has a .card-body
			if( content ){
				// if the content has a class of text-light,
				if(content.classList.contains('text-light')){
					attrs.background_color = 'light';
				
					// background_layout opposite background_color 
					attrs.background_layout = 'dark';
				}else{

					attrs.background_color = 'dark';
				
					// background_layout opposite background_color 
					attrs.background_layout = 'light';
				}

				content = content.innerHTML.trim();
			}

			// remove the card layout class from class list
			element.classList.remove('card');
			for( const c of element.classList.values() ) {
				if( c.startsWith('card-') ) {
					element.classList.remove(c);
				}
			}
			break;
		}
		case 'heading': {

			attrs = {
				title: element.innerHTML.trim(),
				title_level: element.tagName.toLowerCase(),
				...bsToProp(element.classList, element?._rawAttrs?.style),
			};

			// if there was a text orientation, it needs to be title_text_align.
			if( attrs.text_orientation ) {
				attrs.title_text_align = attrs.text_orientation;
				delete attrs.text_orientation;
			}

			// if there was a font color, it needs to be title_text_color.
			if( attrs.font_color ) {
				attrs.title_text_color = attrs.font_color;
				delete attrs.font_color;
			}

			content = element.innerHTML.trim()

			break;
		}
	}

	if( element.classList.length ){
		attrs.class = [...element.classList.values()].join(' ').trim();
	}

	//  return the module shortcode
	return addElement(
		moduleName, 
		{
			limiter: 'bracket', 
			attrs: {
				_builder_version: DIVI_VER,
				...attrs
			},
			content
		}
	);
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
		
		let buildPath = path.join( appPath, 'build' );
		let favicon = path.join( appPath, 'build', 'favicon.ico' );
		let logo = fs.existsSync(path.join(appPath, 'build', 'media', 'logo.png') ) ?
			path.join(appPath, 'build', 'media', 'logo.png') :
			path.join(appPath, 'build', 'caweb', 'template', 'media', 'logo.png');
		
		let siteData = fs.existsSync( appPath, 'caweb.json' ) ? 
			JSON.parse( fs.readFileSync( path.join(appPath, 'caweb.json') ) ) : 
			{
				site:{
					favicon,
					logo
				}
			};

		let pages = [];
		
		// if site data has no site object, we want to create it
		if( ! siteData.site ) {
			siteData.site = {favicon, logo};
		}

		/**
		 * Return all .html files in the build directory
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
			
			// We use jsdom to emulate a browser environment and get the window.document
			let fileMarkupJSon = await jsdom.JSDOM.fromFile( filePath );
			let { document } = fileMarkupJSon.window;

			validatePage( document );

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

					// site info
					let slug = file.replace( '.html', '' );
					let title = slug.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

					pages.push({
						title,
						slug,
						shortcodeContent
					});

				}

				
			}

		}
		
		// if no favicon is set, we want to set the default favicon
		if( ! siteData?.favicon ){
			siteData.favicon = favicon;
		}

		// if no logo is set, we want to set the default logo
		if( ! siteData?.logo ){
			siteData.logo = logo;
		}

		// add sync entry and pages to siteData
		siteData = {
			...siteData,
			sync:{
				...siteData.sync || {},
				static:{
					user: 'static',
					pwd: 'static',
					url: 'static'
				}
			},
			media: path.join( appPath, 'build', 'media' ),
			pages,
		}

		// write the site data to the file
		fs.writeFileSync(
			path.join( appPath, 'caweb.json' ),
			JSON.stringify( siteData, null, 4 )
		);
		
		writeLine( chalk.green( 'Site converted successfully.' ) );
		
};

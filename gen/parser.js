/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
import { HTMLToJSON } from 'html-to-json-parser';
import jsdom from 'jsdom';

/**
 * Internal dependencies
 */

/**
 * Path Directory Locations
 * - appPath - Project Application Path
 * - srcPath - Project Application Src Path
 * - publicPath - Project Application Public Path
 * - dataPath - Project Application Data Path
 */
const appPath = path.resolve(process.cwd());
const srcPath = path.join( appPath, 'src');
const dataPath = path.join( srcPath, 'data');
const assetsPath = path.join( srcPath, 'assets');

const fallbackPath = path.join( appPath, 'node_modules', '@cdt', 'template');

/**
 * Generate Pages
 *
 * @async
 * @param {Object} siteData Data to use when creating pages
 * @returns {string}
 */
async function generatePages(siteData){

  // we start with a blank html and schema
  let page = '<html><html>';
  let schema = {};

  // if src/index.html exists
  if(fs.existsSync(path.join(srcPath, 'index.html'))){

    // get index path file location
    page = path.join(srcPath, 'index.html')
      
    // generate page schema
    schema = await convertHTMLtoJson(page, false);

    // read contents of index file, we strip any newlines
    //page = fs.readFileSync( page ).toString().replace(/\n[\s]+/g,'');
  }

  // convert page to jsdom object
  let dom = new jsdom.JSDOM( page );
  
  // if we should be using the template
  if( process.env.CDT_TEMPLATE ){

    // read contents of template index file, we strip any newlines
    page = fs.readFileSync( path.join(fallbackPath, 'src', 'index.html') ).toString().replace(/\n[\s]+/g,'');
      
    // create template jsdom object
    let templateDom = new jsdom.JSDOM( page );
    
    // colorscheme
    let colorCSS = path.join(fallbackPath, 'build', 'oceanside.css');
    let colorJS = path.join(fallbackPath, 'build', 'oceanside.js');

    dom.window.document.querySelector('head').append(
      `<link rel="stylesheet" type="text/css" href="${colorCSS}">`
    );


    // update template dom by appending contents of existing dom body
    // after the header 
    templateDom.window.document.querySelector('header').append(
      dom.window.document.querySelector('body')
    );

    // update existing dom with templated changes.
    dom = new jsdom.JSDOM( templateDom.window.document.documentElement.outerHTML);
  }
  
  // generate any data attributes
  populateDataAttrs( dom, siteData, schema );
  
  return dom.window.document.documentElement.outerHTML;

}


/**
 * Populate data-cagov attributes with siteData
 * 
 * @param {jsdom.JSDOM} dom HTML 
 * @param {Object} siteData
 * @param {Object} schema
 */
function populateDataAttrs(dom, siteData, schema){
  for( const [attr, data] of Object.entries(siteData) ){
    // if attribute isn't in the schema don't do anything
    if( ! schema.data || ! Object.keys(schema.data).includes(attr) ){
      continue;
    }

    // any data- attributes should be prefixed with cagov
    // get any elements with the appropriate data- attr 
    let elements = dom.window.document.querySelectorAll(`[data-cagov-${attr}]`);

    // if the data is an array|object pass as data
    let value = Array.isArray(data) || 'object' === typeof data  ? JSON.stringify( data ) : data;

    elements.forEach(element => {
      element.setAttribute(`data-cagov-${attr}`, value);
    });

  }
}


/**
 * Generates a page schema including any data attributes in src/data/index.json
 *
 * @async
 * @param {*} file
 * @param {boolean} [write=true]
 * @param {string} [outputPath='']
 * @returns {unknown}
 */
async function convertHTMLtoJson( file, write = true, outputPath = '' ){
      if( fs.existsSync( file )){
        let template = fs.readFileSync( file ).toString().replace(/\n[\s]+/g,'');
        let markup = await HTMLToJSON(template, false )
          
        let data = fs.existsSync( path.join(dataPath, 'index.json') ) ?
          JSON.parse( fs.readFileSync( path.join(dataPath, 'index.json') ) ) : {};

        // remove any examples data
        delete data.examples;

        let schema = {
          title: "California Department of Technology Schema",
          $schema: "http://json-schema.org/2019-09/schema",
          $id: "https://json-schema.org/draft/2019-09/schema",
          type: "object",
          description: "California Department of Technology Schema",
          data,
          markup,
        };

        // Write schema file.
        if( write ){
          fs.writeFileSync(
            path.join(outputPath, 'schema.json'),
              JSON.stringify( schema, null, 4 )
          );
        }else{
          return schema;
        }
        
      }
}

export {
  generatePages
};
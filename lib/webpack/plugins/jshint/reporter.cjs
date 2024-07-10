//"use strict";
const path = require('path');
const fs = require('fs');
const htmlFormat = require('html-format');

let sortedReport = {
  errors: [],
  warnings: [],
  info: []
};

let title = process.cwd().split('\\').pop();

let output = [];

/**
 * Adds Head to output.
 */
function addHead(){

  output.push(
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `<title>JSHint Report for ${title}</title>`,
    '<script src="./jshint.js"></script>',
    '<link rel="stylesheet" href="./jshint.css">',
    '</head>'
  )
}

/**
 * Adds Header to output.
 */
function addHeader(){
  let navItems = []
  
  // add dark mode switch just for fun.
  navItems.push(
    '<li>',
    '<button onclick="jsHint.toggleDarkMode()" class="btn button__theme-toggle" aria-label="Dark Mode"></button>',
    '</li>'
  );
  // open header and add title
  output.push(
    '<header id="top" class="site__header">',
    `<h1>JSHint Report for ${title}</h1>`,
  )
  
  // add navigation if items were found
  if( navItems.length ){
    output.push(
      '<nav class="nav">',
      '<ul>',
      ...navItems,
      '</ul>',
      '</nav>',
    )
  }

  // close the header.
  output.push(
    '</header>',
  )

}

/**
 * Adds Result Summary to output.
 * @param {Array} results 
 */
function addSummary(results){
  let items = [];

  // summary
  results.forEach(function(result) {
    var file = result.file;
    var error = result.error;

    items.push(
      '<li>',
      `<a href="#${file.replace(/[\\:\.]/g, '-').toLowerCase()}" target="_blank">${file}</a>: line ${error.line}, col ${error.character}, ${error.reason}`,
      '</li>'
    )
  })

  let summary = [];
  for(let [category] of Object.entries(sortedReport) ){
    if( sortedReport[category].length ){
      let cCase = capitalCase(category);
      // if there is just 1, drop the plural 
      if( 1 === sortedReport[category].length ){
        cCase = cCase.slice(0, -1)
      }
      summary.push(`${sortedReport[category].length} ${cCase} Detected`)
    }
  }

  output.push(
    '<section class="hint" id="summary">',
    '<header class="hint__header">',
    `<h2 class="hint__title">Summary: <em>${summary.join(' & ')}</em></h2>`,
    '</header>',
    '<ol>',
    ...items,
    '</ol>',
    '</section>'
  );

}

/**
 * Process data
 * 
 * Data Object
 * {
 *  functions,
 *  options,
 *  errors,
 *  globals,
 *  unused,
 *  member,
 *  file
 * }
 */
function addBreakdown({
  functions,
  options,
  errors,
  implieds,
  globals,
  unused,
  member,
  file
}){
  let functionList = [];
  let errorList = [];
  let unusedList = [];

  /**
   * Process function data
   * 
   * Function Data Object
   * {
   *  name,
   *  param,
   *  line,
   *  character,
   *  last,
   *  lastcharacter,
   *  metrics {
   *    complexity,
   *    parameters,
   *    statements
   *  }
   * }
   */
  if( functions ){
    functions.forEach(({ name, param, line, character, metrics }) => {
      let { complexity, parameters, statements } = metrics;

      functionList.push(
        '<li>',
        `<p><b>Name:</b> ${name}</p>`,
        param && param.length ? `<p><b>Parameters:</b> ${param}</p>` : '',
        `<p><b>Line:</b> ${line}</p>`,
        `<p><b>Col:</b> ${character}</p>`,
        `<p><b>Metrics:</b></p>`,
        '<ul>',
        `<li><b>Cyclomatic Complexity Number:</b> ${complexity}</li>`,
        `<li><b>Arguments:</b> ${parameters}</li>`,
        `<li><b>Statements:</b> ${statements}</li>`,
        '</ul>',
        '</li>'
      )
    })
  }


  /**
   * Process error data
   * 
   * Error Data Object
   * {
   *  id,
   *  raw,
   *  code,
   *  evidence,
   *  line,
   *  character,
   *  scope,
   *  a,
   *  b,
   *  c,
   *  d,
   *  reason
   * }
   */
  if( errors ){
    errors.forEach(({reason, evidence, line, character}) => {
      errorList.push(
        '<li>',
        `<p><b>Reason:</b> ${reason}</p>`,
        `<p><b>Evidence:</b> ${evidence}</p>`,
        `<p><b>Line:</b> ${line}</p>`,
        `<p><b>Col:</b> ${character}</p>`,
        '</li>'
      )
    })
  }

  /**
   * Unused Data
   * {
   *  name,
   *  line,
   *  character
   * }
   */
  if( unused ){
    unused.forEach(({name, line, character}) => {
      unusedList.push(
        '<li>',
        `<p><b>Name:</b> ${name}</p>`,
        `<p><b>Line:</b> ${line}</p>`,
        `<p><b>Col:</b> ${character}</p>`,
        '</li>'
      )
    })
  }

  output.push(
    `<section id="${file.replace(/[\\:\.]/g, '-').toLowerCase()}" class="hint">`,
    '<header class="hint__header">',
    `<h2 class="hint__title"><a href="${file}" class="link" target="_blank"></a>File: <em>${file}</em></h2>`,
    '<a class="btn back-to-top" href="#top" title="Back to top">⬆</a>',
    '</header>',
    `<h3>Functions: <span class="count">${functions.length}</span></h3>`,
     functionList.length ? `<ol>${functionList.join('\n')}</ol>` : '',
    `<h3>Errors: <span class="count">${errors ? errors.length : 0}</span></h3>`,
    errorList.length ? `<ol>${errorList.join('\n')}</ol>` : '',
    `<h3>Unused: <span class="count">${unused ? unused.length : 0}</span></h3>`,
    unusedList.length ? `<ol>${unusedList.join('\n')}</ol>` : '',
    '</section>'  
  )
}

/**
 *  Add file list sidebar
 */
function addSidebar(data){
  let fileList = [];

  data.forEach(({file}) => {
    fileList.push(
      `<li><a href="#${ file.replace(/[\\:\.]/g, '-').toLowerCase() }">${file}</a></li>`
    )
  })
  output.push(
    '<aside>',
    '<section>',
    '<header class="hint__header"><h2 class="hint__title">Files</h2></header>',
    '<ol>',
    fileList.join('\n'),
    '</section>',
    '</ol>',
    '</aside>'
  )
}

/**
 * JSHint Reporter
 * 
 * @param {*} results 
 * @param {*} data 
 * @param {*} opts 
 */
function reporter(results, data, opts){
  let outputFolder = process.env.JSHINT_OUTPUT_DIR ? 
    path.resolve( process.env.JSHINT_OUTPUT_DIR ) : 
    path.join(__dirname, 'public')
  let outputFilename = path.join(outputFolder, `${process.env.JSHINT_OUTPUT_FILENAME ?? 'jshint'}.html` );

  // process results.
  results.forEach((result) => {
    var file = result.file;
    var error = result.error;

    // add error to sorted report array
    switch( error.code.charAt(0) ){
      case 'E': // errors
        sortedReport.errors.push({...error, file: file})
        break;
      case 'I': // info
        sortedReport.info.push({...error, file: file})
        break;
      case 'W': // warnings
        sortedReport.warnings.push({...error, file: file})
        break;
    }
  })

  try{

    // Add Head Section.
    addHead();

    // Add Header Section.
    addHeader();

    output.push ('<div id="main">');

    addSidebar(data);
    
    output.push ('<div id="information">');
    
    // Add Summary.
    addSummary(results);

    // process data.
    data.forEach((d) => {
      /*
      Only used to see what the data is passing
      for(let [prop, value] of Object.entries(d) ){
        output.push(prop)
        output.push('object' ==  typeof value ? value[0] : value)
        output.push('<br />')
      }
      */
      addBreakdown(d)
    })

    output.push (
      '</div> <!-- Close information div -->',
      '</div> <!-- Close main div -->'
    );

  }catch(err){
    process.stderr.write(err.toString())
    process.exit(1)
  }

  // wrap the output in html tags.
  output = ['<html>', ...output, '</html>']

  fs.mkdirSync( outputFolder, {recursive: true} );

  // write html file
  fs.writeFileSync(
    outputFilename,
    htmlFormat(output.join('\n')," ".repeat(4), 250)
  );

  // write jshint.js file.
  fs.writeFileSync(
    path.join(outputFolder, 'jshint.js'),
    jsContent()
  );

  // write jshint.css file.
  fs.writeFileSync(
    path.join(outputFolder, 'jshint.css'),
    cssContent()
  );

  // console.log( htmlFormat(output.join('\n')," ".repeat(4), 250) );
}

function capitalCase(str){
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Returns string content for css file
 * @returns string
 */
function cssContent(){
  return `
/*
 * JSHint
 */
body {
	--body-margin: 2rem;

	/* Body colours */
	--body-bg: #fff;
	--body-fg: #111;

	/* Nav & link colours */
	--nav-bg: #eee;
	--nav-bg-hover: #bbb;
	--nav-fg: #11c;

	/* Heading colours */
	--h-fg: #222;
	--h-bg: #eee;

	/* Border style for bordered components */
	--component-border: 1px solid #aaa;

	/* Consistent component margins */
	--component-margin-sm: 1.5rem;
	--component-margin-lg: 3rem;

  /* Colour chips */
	--count-bg: #eee;
	--count-border: var(--component-border);
}
/*
 * Dark mode
 */
body.is-dark-mode {
	/* Body colours */
	--body-bg: #111;
	--body-fg: #fff;

	/* Nav & link colours */
	--nav-bg: #444;
	--nav-bg-hover: #222;
	--nav-fg: #bcf;

	/* Heading colours */
	--h-fg: #eee;
	--h-bg: #222;
  
	/* Border style for bordered components */
	--component-border: 1px solid #666;

	/* Consistent component margins */
	--component-margin-sm: 1.5rem;
	--component-margin-lg: 3rem;


	/* Colour chips */
	--count-bg: #111;
	--count-border: var(--component-border);
}
/*
 * General
 */
* {
	box-sizing: border-box;
}

html {
	scroll-behavior: smooth;

	@media (prefers-reduced-motion: reduce) {
		scroll-behavior: auto;
	}
}

body {
	background-color: var(--body-bg);
	color: var(--body-fg);
	font-family: sans-serif;
	margin: var(--body-margin);
}

a {
	color: var(--nav-fg);
}
p{
  margin: 0 0 .5em 0
}
h1, h2 {
	font-weight: normal;
}

h1, h2, h3 {
	color: var(--h-fg);
	margin: 0 0 var(--component-margin-sm) 0;
}
/*
 * Layout
 */
#main{
  display: flex;
}
aside {
  margin-right: calc(1.5* var(--body-margin));
  padding-right: calc(1* var(--body-margin));
  border-right: var(--component-border);
}
#information{
  flex-grow: 1
}
/*
 * Hints
 */
.hint {
	margin-bottom: var(--component-margin-lg);
}
.hint__header {
	align-items: baseline;
	background-color: var(--h-bg);
	display: flex;
	justify-content: space-between;
	margin-right: calc(-1 * var(--body-margin));
	margin-left: calc(-1 * var(--body-margin));
	margin-bottom: var(--component-margin-sm);
	padding: var(--component-margin-sm) var(--body-margin) 0;
	position: sticky;
	top: 0;
	z-index: 1;
}

/*
 * Lists
 */
ul,
ol {
	padding: 0 0 0 2em;
}
li {
	margin: 0 0 2em 0;
}
li li {
  margin: 0;
}
/*
 * Header, nav, 'back to top' button
 */
.site__header {
	align-items: baseline;
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
}
  .nav {
	margin-bottom: var(--component-margin-sm);
}

.nav ul {
	display: flex;
	justify-content: flex-start;
	align-items: center;
	list-style: none;
	padding: 0;
}

.nav li {
	margin-bottom: var(--component-margin-sm);
	margin: 0 0.5em 0 0;
}

.nav a {
	display: block;
	height: 100%;
}

.nav a,
.btn {
	background-color: var(--nav-bg);
	padding: 0.5em;
	text-decoration: none;
	transition: background-color 0.2s ease;
}

.nav a:hover,
.nav a:focus,
.btn:hover,
.btn:focus {
	background-color: var(--nav-bg-hover);
}

.nav a:focus,
.btn:focus {
	outline: 4px dashed var(--nav-fg);
}

.btn {
	font-size: 1.2em;
	margin-bottom: var(--component-margin-sm);
	text-align: center;
}
/*
 * Count component on colour chips
 */
.count {
	background-color: var(--count-bg);
	border: var(--count-border);
	border-radius: 50%;
	box-sizing: border-box;
	color: var(--count-fg);
	display: inline-block;
	height: auto;
	min-width: 2.3em;
	padding: 0.5em;
	text-align: center;

	/* Counteract .chip:hover */
	font-weight: normal;
	text-shadow: none;
}
/*
 * Darkmode switch
 */
.button__theme-toggle {
	background: transparent;
	border: none;
	cursor: pointer;
	margin-bottom: 0;
}

.button__theme-toggle::before {
	content: "🌛";
	font-size: 1.5rem;
}

body.is-dark-mode .button__theme-toggle::before {
	content: "🌞";
}

/*
 * Link Icon
 */
.link{
  text-decoration: none;
  cursor: pointer;
}
.link::before{
  content: "🔗";
}
`;
}

/**
 * Returns string content for js file
 * @returns string
 */
function jsContent(){
  return `
  
const jsHint = {};

document.addEventListener( 'DOMContentLoaded', () => {
	const button = document.querySelector( '.button__theme-toggle' );

	jsHint.toggleDarkMode = function() {
		const isDarkMode = document.body.classList.contains( 'is-dark-mode' );
		if ( isDarkMode ) {
			button.setAttribute( 'aria-pressed', 'false' );
			document.body.classList.remove( 'is-dark-mode' );
		} else {
			button.setAttribute( 'aria-pressed', 'true' );
			document.body.classList.add( 'is-dark-mode' );
		}
	}

	// Set is-dark-mode class if user has requested dark mode.
	if ( window.matchMedia( '(prefers-color-scheme: dark)' ).matches ){
		document.body.classList.add( 'is-dark-mode' );
		button.setAttribute( 'aria-pressed', 'true' );
	}

});
`;
}

module.exports = {
  reporter
}
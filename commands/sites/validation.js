import { parse } from 'node-html-parser';
import { writeLine } from '../../lib/index.js';

/**
 * Validates the HTML of a page.
 * @param {JSDOM} document - Window document from JSDOM.
 * @returns {boolean} - Returns true if the HTML is valid, false otherwise.
 */
function validatePage( document ){
	let mainContent = document.querySelector( '#page-container #main-content' );

    // Check if document doesn't have a #page-container #main-content
    if( ! mainContent ){
        throw new Error("The page does not have a #page-container #main-content.");
    }

    let mainContentJson =  parse( mainContent.innerHTML );
    let mainJson = ''
    let asideJson = '';

    /**
     * Main content is allowed 2 elements
     * - main - renders the main content
     * - aside - renders the sidebar content
     */
    for( const element of mainContentJson.children ){
        if( element.tagName !== 'MAIN' && element.tagName !== 'ASIDE' ){
            throw new Error("The main content must only contain <main> and <aside> elements.");
        }else if( element.tagName === 'MAIN' ){
            mainJson = element
        }else if( element.tagName === 'ASIDE' ){
            asideJson = element
        }
    }

    /**
     * Main should only consist of <div> elements.
     * - .container-fluid - Used for full width containers.
     * - .container - used for standard containers.
     * -- Should only consist of div.row  
     * ---- Should only consist of div.col-#  
     * ------ All content should be in a column
     */
    for( const element of mainJson.children ){
        if( element.tagName !== 'DIV' ){
            throw new Error("The <main> element must only contain <div> elements.");
        }else if( ! element.classList.contains( 'container-fluid' ) && ! element.classList.contains( 'container' ) ){
            throw new Error("The <main> element must only contain <div> elements with class 'container-fluid' or 'container'.");
        }else if( element.classList.contains( 'container' ) ){
            for( const row of element.children ){
                if( row.tagName !== 'DIV' || ! row.classList.contains( 'row' ) ){
                    throw new Error("The <div> element with class 'container' must only contain <div> elements with class 'row'.");
                }else{
                    for( const col of row.children ){
                        if( col.tagName !== 'DIV' || ! col.classList.toString().match( /col[-\d]*/g ) ){
                            throw new Error("The <div> element with class 'row' must only contain <div> elements with class 'col-#'.");
                        }
                    }
                }
            }
        }

    }

    
}

export default validatePage;
/**
 * External dependencies
 */
import path from 'path';
import axios from 'axios';
import terminalLink from  'terminal-link';
import axiosRetry from 'axios-retry';

/**
 * Internal dependencies
 */
import {
    projectPath,
    runCmd
} from '../index.js';

const endpoint = '/wp-json/wp/v2';
const requestDelay = 7500; // we wait 5 seconds between requests
const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

axiosRetry(axios, 
    { 
        retries: 3, // attempt requests 3 times
        shouldResetTimeout: true, // reset timeout on retries
        retryCondition: (error) => true, // retry on any error
        retryDelay: (retryCount) => 5000 // retry delay
    }
);

function processData( data ){
    /**
     * If wpautop is enabled and data contains Divi shortcodes, 
     * WordPress will automatically add an opening/closing p tag that needs to be removed.
     * @link https://developer.wordpress.org/reference/functions/wpautop/
    */
    if( data.includes('et_pb_section') && 
        data.startsWith('<p>') &&
        data.endsWith('</p>\n')
    ){
        data = data.substring(3, data.length - 5)
    }
    return data
        .replace(/(&#8221;)|(&#8243;)|(&#8220;)/g, '') // replace double encoding
        .replace(/(\s{2,})/g, ' ') // replace misc spacing // &#8220;

}

function processUrlParam( param ){
    return ( Array === typeof param ? param.join(',') : param )
}

/**
 * Make Requests to WordPress Rest API and return different taxonomy results.
 * 
 * 
 * @async
 * @param {Object} request Data to pass to Axios request.
 * @param {string} [tax='pages'] Taxonomy of the request made. Default pages, available choices: pages,posts,menus,menu-items,settings,media
 * @returns {unknown}
 */
async function getTaxonomies( request, tax = 'pages' ){
    const fields = request.fields ? request.fields : [
        'id',
        'type',
        'alt_text',
        'caption', 
        'slug',
        'title',
        'source_url',
        'mime_type',
        'content',
        'date',
        'date_gmt',
        'status',
        'featured_media',
        'comment_status',
        'ping_status',
        'template',
        'format',
        'categories',
        'tags',
        'meta',
    ];

    let urlParams = [
        'order=asc'
    ]


    // if fields are passed
    if( fields.length && 'all' !== fields ){
        urlParams.push( `_fields=${ fields.join(',')}` );
    }
    

    // if no request is added default to GET
    if( ! request.method ){
        request.method = 'GET'
    }

    // if parent argument 
    if( request.parent ){
        urlParams.push( `parent=` + processUrlParam( request.parent ))
    }

    // if include argument 
    if( request.include ){
        urlParams.push( `include=` + processUrlParam( request.include ))
    }

    // if menus argument 
    if( request.menus ){
        urlParams.push( 'menus=' + processUrlParam( request.menus ) );
    }

    // if per page argument.
    urlParams.push( 'per_page=' + request.per_page ? request.per_page : '100' )


    // if posts_per_page argument.
    urlParams.push( 'posts_per_page=' + request.posts_per_page ? request.posts_per_page : '10' )


    let collection = [];
    let results = false;
    
    /**
     * Results are capped to 100 max per page
     * in order to return all results, we make the same requests and pass the page parameter.
     * @see https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/
     * @type {number}
    */
    let page = 1;

    do{
        
        results = await axios.request(
            {
                ...request,
                url: `${request.url}${endpoint}/${tax}?` + urlParams.join('&') + `&page=${page}`
            }
        ).then(
            (res) => { 
                // if no data or empty data return false.
                if( ! res.data || ( 'object' === typeof res.data && ! Object.entries(res.data).length ) ){
                    return false;
                }

                // add results to collection
                collection = collection.concat( res.data );
                return true
        }).catch( 
            (error) => {
                return false
            }
        );

        // settings taxonomies will always return results regardless of the page parameter.
        // so we return false after the first request
        if( 'settings' === tax ){
            break;
        }

        page++;
    }while( results )
   
    
    return collection;
}

async function createTaxonomies( taxData, request, tax = 'pages', spinner ){
    // if no request is added default to POST
    if( ! request.method ){
        request.method = 'POST'
    }

    let collection = [];

    for( let obj of taxData ){
        // endpoint url.
        let url = `${request.url}${endpoint}/${tax}`;
        let existingID = false;

        // The REST API doesn't allow passing the id, in order to maintain ID's we make an additional request to our plugin endpoint.
        if( obj.id ){
            // first we check if the ID exist
            let idExists = await axios.request(
                {   
                    ...request, 
                    method: 'GET',
                    url: `${url}/${ obj.id }`
                } 
                )
                .then((res) => { return res.data.id })
                .catch(error => {return false;})

            // for menus if ID doesn't exist we also check for matching slug
            // if a menu with a matching slug exists we return that id instead.
            if( 'menus' === tax && ! idExists ){
                idExists = await axios.request(
                    {   
                        ...request, 
                        method: 'GET',
                        url: `${url}/?slug=${ obj.slug }`
                    } 
                    )
                    .then((res) => { return res.data[0].id })
                    .catch(error => {return false;})

            }
            /**
             * if the ID doesn't exist we save it so we can make a request to our plugin endpoint.
             * if it does exist update endpoint url so we update the existing item.
             */
            if( ! idExists ){
                existingID = obj.id;
            }else{
                url = `${url}/${ obj.id }`;
            }

            // id has to be deleted.        
            delete obj.id;
        }

        // process properties
        if( obj.content && obj.content.rendered ){
            obj.content = processData(obj.content.rendered);
        }
        
        if( obj.title && obj.title.rendered ){
            obj.title = processData(obj.title.rendered);
        }

        if( obj.caption && obj.caption.rendered ){
            obj.caption = processData(obj.caption.rendered);
        }

        // make WordPress REST API request.
        let results = await axios.request({
                ...request,
                timeout: requestDelay,
                data: 'media' === tax ? createMediaItem(obj) : obj,
                url
            })
            .then( async (res) => { return res.data; } )

        /**
         * if the obj had an existing ID that didn't exist we make a request to our plugin endpoint to update the IDs.
         */
        if( existingID ){

            await axios.request({
                ...request,
                url: `${request.url}/wp-json/caweb-dev/v1/sync`,
                timeout: requestDelay,
                data: {
                    id: results.id,
                    newId: existingID,
                    tax,
                    locations: 'menus' === tax ? obj.locations : []
                }
            })
            .then( async (res) => { return res.data; } )
            
            // update the API results ID, back to the existing ID from earlier.
            results.id = existingID;
        }

        // add results to collection
        collection = collection.concat( results );

        let p = tax.charAt(0).toUpperCase() + tax.substring(1, tax.length - ( tax.endsWith('s') ? 1 : 0 ) );

        if( undefined !== results && results.id ){
            spinner.info(`${p}: ${results.id} was created.`);
        }
        
    }


}

function createMediaItem( media ){
    
    let fd = new FormData();
    let featureMediaFile = new File(
        [
            media.data
        ], 
        media.source_url.split('/').pop(), 
        {
            type: media.mime_type
        }
    );
    fd.append('file', featureMediaFile );
    fd.append('title', media.title);
    fd.append('caption', media.caption);
    fd.append('alt_text', media.alt_text);
    fd.append('date', media.date);

    return fd;
}


export {
    getTaxonomies,
    createTaxonomies
}
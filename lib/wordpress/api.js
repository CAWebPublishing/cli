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
const endpoint = '/wp-json/wp/v2';
const syncEndpoint = '/wp-json/caweb/v1/sync';

// Axios Configurations.
axiosRetry(axios, 
    { 
        retries: 3, // attempt requests 3 times
        shouldResetTimeout: true, // reset timeout on retries
        retryCondition: (error) => { 
            if( error.response && error.response.status === 500 ){
                return true;
            }
        }, // retry on any network or 5xx error
        retryDelay: (retryCount, error ) => {
            return 5000 // retry delay
        }
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
        'parent',
        '_links'
    ];

    let urlParams = [
        'order=' + ( request.order ? processUrlParam(request.order) : 'asc' )
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

    // if taxonomies is not menus, we add the orderby parameter.
    if( 'menus' !== tax  ){
        urlParams.push( `orderby=` + (request.orderby ? processUrlParam(request.orderby) : 'id') );
    }

    // if embed is set to true, we add the _embed parameter.
    if( request.embed ){
        urlParams.push( '_embed' );
    }

    /**
     * The per_page parameter is capped at 100.
     * 
     * @see https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/
     */
    request.per_page = request.per_page && request.per_page <= 100 ? request.per_page : 100;
    urlParams.push( 'per_page=' + request.per_page  );

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
        let existingID = obj.id ? obj.id : false;

        // process object properties.
        for( let prop in obj ){
            // we process the rendered property and delete the rendered property.
            if( 'object' === typeof obj[prop] && null !== obj[prop] && obj[prop].hasOwnProperty('rendered') ){
                    obj[prop] = processData(obj[prop].rendered);
            }

            // if obj has a parent and it's 0, we delete it.
            if( 'parent' === prop && 0 === obj[prop] ){
                delete obj[prop];
            }

            // disallowed props.
            if( ['_links', '_embedded'].includes(prop) ){
                delete obj[prop];
            }
        }
       
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

            /**
             * Menus Only
             * Since we can't have duplicated slugs, if the ID doesn't exist we also check for matching slugs.
             */
            if( 'menus' === tax && false === idExists ){
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

            // if the ID exists we append it to the url.
            if( idExists ){
                url = `${url}/${ idExists }`;
                
                // we store the existing ID for later use.
                existingID = idExists;
            }

            // id has to be deleted.        
            delete obj.id;
        }

        // make WordPress REST API request.
        let results = await axios.request({
                ...request,
                data: 'media' === tax ? createMediaItem(obj) : obj,
                url
            })
            .then( async (res) => { return res.data; } )

            
        /**
         * if the obj had an existing ID we make a request to our plugin endpoint to update the IDs.
         */
        if( existingID ){
            let extraArgs = {};

            // if media 
            if( 'media' === tax ){
                // get original source domain
                let sourceDomain = obj.source_url.substring(0, obj.source_url.indexOf('/wp-content/uploads'));
                // get expected guid, replace source domain with the new domain.
                let expectedGuid = obj.source_url.replace(sourceDomain, request.url);

                extraArgs = {
                    guid: results.guid.rendered,
                    newGuid: expectedGuid,
                    // if media and source_url is different from the guid, we update the guid.
                    media_details: results.media_details,
                }
            }

            await axios.request({
                ...request,
                url: `${request.url}${syncEndpoint}`,
                data: {
                    ...extraArgs,
                    id: results.id,
                    newId: existingID,
                    tax,
                    locations: 'menus' === tax ? obj.locations : [],

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

/**
 * Create a FormData from the Media Item Object
 *
 * @param {Object} media Media Object.
 * @returns {FormData}
 */
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
    fd.append('caption', media.caption );
    fd.append('alt_text', media.alt_text);
    fd.append('date', media.date);
    fd.append('media_details', media.media_details);

    return fd;
}


export {
    getTaxonomies,
    createTaxonomies
}
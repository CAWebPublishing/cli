/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import terminalLink from  'terminal-link';
import loadConfig from '@wordpress/env/lib/config/load-config.js';

/**
 * Internal dependencies
 */
import {
	appPath,
    projectPath,
    runCmd
} from '../lib/index.js';

const endpoint = '/wp-json/wp/v2';
const requestDelay = 1000; // we wait 1 second between requests

const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

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

async function getTaxonomies( request, tax = 'pages', limit = 5000 ){
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
        'meta'
    ];

    let urlParams = [
        'per_page=100',
        `_fields=${ fields.join(',')}`,
        'order=asc'
    ]

    // if no request is added default to GET
    if( ! request.method ){
        request.method = 'GET'
    }

    // if parent argument 
    if( request.parent ){
        urlParams.push( `parent=` + ( Array === typeof request.parent ? request.parent.join(',') : request.parent ))
    }

    // if include argument 
    if( request.include ){
        urlParams.push( `include=` + ( Array === typeof request.include ? request.include.join(',') : request.include ))
    }

    let collection = [];

    for( let i = 1; i < limit / 100; i++ ){
        // make requests for each page
        urlParams.push(`page=${i}`)

        let results = await axios.request(
            {
                ...request,
                url: `${request.url}${endpoint}/${tax}?` + urlParams.join('&')
            }
        ).then(
            (res) => { 
                return res.data
        }).catch( 
            (error) => {return false}
        );


        // if no more results stop making requests
        if( ! results ){
            break;
        }
        
        // add results to collection
        collection = collection.concat( results );

        // lets wait requestDelay between requests.
        await sleep( requestDelay );
    }
    
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
        
        // in order to maintain ID's, we have to use the cli, the REST API doesn't allow passing the id.
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
             * if the ID doesn't exist we save it so we can update via CLI later on.
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
        if( obj.content ){
            obj.content = processData(obj.content.rendered);
        }
        
        if( obj.title ){
            obj.title = processData(obj.title.rendered);
        }

        if( obj.caption ){
            obj.caption = processData(obj.caption.rendered);
        }

        // make WordPress REST API request.
        let results = await axios.request({
                ...request,
                data: 'media' === tax ? createMediaItem(obj) : obj,
                url
            })
            .then( async (res) => { return res.data; }, axiosErrorHandler )

            
        /**
         * if the obj had an existing ID that didn't exist
         */
        if( existingID ){
            
            let post_tbl = `wp_posts`;
            let post_meta_tbl = `wp_postmeta`;
            let term_taxonomy_tbl = `wp_term_taxonomy`;
            
            const cmd = [
                path.join(projectPath, 'bin', 'wp-cli.phar'),
                `--ssh=${request.ssh}`,
                '--skip-themes',
                '--skip-column-names',
                `--url=${new URL(request.url).origin}`
            ];

            // if taxonomy is page/post/media.
            if( ['pages', 'posts', 'media'].includes(tax) ){


                /**
                 * Since the REST API doesn't detected trashed posts/pages.
                 * We have to do a drop before we can do an update.
                 * Since trashed posts/pages stay in the database
                 */
                // drop post
                await runCmd(
                    'php',
                    [
                        ...cmd,
                        `db query 'DELETE FROM ${post_tbl} WHERE ID=${existingID}'`,
                    ]
                )

                // drop post meta.
                await runCmd(
                    'php',
                    [
                        ...cmd,
                        `db query 'DELETE FROM ${post_meta_tbl} WHERE post_id=${existingID}'`,
                    ]
                )

                // now we can update the new ID with the existing ID.
                await runCmd(
                    'php',
                    [
                        ...cmd,
                        `db query 'UPDATE ${post_tbl} SET ID=${existingID}  WHERE ID=${results.id}'`,
                    ]
                )
                // update post meta.
                await runCmd(
                    'php',
                    [
                        ...cmd,
                        `db query 'UPDATE ${post_meta_tbl} SET post_id=${existingID}  WHERE post_id=${results.id}'`,
                    ]
                )

            // if taxonomy is menu.
            }else if( 'menus' === tax ){
                // update the term taxonomy table.
                await runCmd(
                    'php',
                    [
                        ...cmd,
                        `db query 'UPDATE ${term_taxonomy_tbl} SET term_taxonomy_id=${existingID},term_id=${existingID} WHERE term_id=${results.id}'`,
                    ]
                )

            }

            // update the API results ID, back to the existing ID from earlier.
            results.id = existingID;
        }

        // add results to collection
        collection = collection.concat( results );

        // We wait requestDelay seconds between requests.
        await sleep( requestDelay );
        
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

function axiosErrorHandler( error ){

    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        let { data, status } = error.response;

        switch( status ){
            case 401: // Invalid Credentials
                data.message +=  `\nPlease check your ${terminalLink('Application Password', 'https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/')}`;
            case 404: // Not Found
                //spinner.fail( `${data.message}` )
                //console.log('Error', `${data.message}`);
                //console.log('Error', `${data}`);
                //process.exit(1)
            default:
                console.log('Error', error.response);
                break;
        }
    } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request);
    } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
    }
}

/**
 * Sync Environments.
 * 
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.from   Remote Site URL with current changes.
 * @param {boolean} options.to   Destination Site URL that should be synced.
 * @param {boolean} options.debug   True if debug mode is enabled.
 */
export default async function sync({
	spinner,
	debug,
	from,
    to
} ) {

    const localFile = path.join(appPath, 'caweb.json');
    const {workDirectoryPath} = await loadConfig(path.resolve('.'));
		
    process.env.WP_CLI_CONFIG_PATH  = path.join(workDirectoryPath, 'config.yml');
    
    // if caweb.json file doesn't exist we don't do anything
    if( ! fs.existsSync(localFile) ){
        spinner.fail('caweb.json file not found.')
        process.exit(1)
    }

    // read configuration file
    const serviceConfig = JSON.parse( fs.readFileSync(localFile) );

    /**
     * make sure instances are in the file.
     * must have sync property
     * each instance has to have a url, user, pwd property
     */
    if( 
        ! serviceConfig.sync || 
        ! serviceConfig.sync[from] ||
        ! serviceConfig.sync[from].url ||
        ! serviceConfig.sync[from].user ||
        ! serviceConfig.sync[from].pwd ||
        ! serviceConfig.sync[to] || 
        ! serviceConfig.sync[to].url ||
        ! serviceConfig.sync[to].user ||
        ! serviceConfig.sync[to].pwd
    ){
        spinner.fail(`caweb.json is not configured properly for ${from} and ${to}.`);
        process.exit(1)
    }
    
    // get instance data
    from = serviceConfig.sync[from];
    let fromOptions = {
        url: from.url,
        headers: {
            Authorization: 'Basic ' + Buffer.from(`${from.user}:${from.pwd}`).toString('base64')
        }
    }
    
    let ssh = 'local' !== to ? to : `docker:${path.basename(workDirectoryPath)}-cli-1`;

    to = serviceConfig.sync[to];

    let toOptions = {
        url: to.url,
        ssh,
        headers: {
            Authorization: 'Basic ' + Buffer.from(`${to.user}:${to.pwd}`).toString('base64'),
            'content-type': 'multipart/form-data',
            'accept': '*/*'
        }
    }


    // get all pages/posts
    spinner.text = `Gathering all pages from ${from.url}`;
    let pages = await getTaxonomies(fromOptions);

    // data display
    //spinner.info();

    let posts = await getTaxonomies(fromOptions, 'posts');

    // create all pages/posts
    spinner.text = `Creating all pages to ${to.url}`;
    await createTaxonomies( pages, toOptions, 'pages', spinner );
    await createTaxonomies( posts, toOptions, 'posts', spinner );

    /**
     * Media Library Handling
     * 1) attached media items by default are only possible on pages.
     * 2) featured media by default are only possible on posts.
     */
    const mediaFields = [
        'id', 
        'source_url', 
        'title', 
        'caption', 
        'alt_text', 
        'date',
        'mime_type'
    ];

    let attachedMedia = await getTaxonomies({ 
            ...fromOptions, 
            fields: mediaFields,
            parent: pages.map((p) => { return p.id })
        }, 
        'media'
    );

    let featuredMedia = await getTaxonomies({ 
            ...fromOptions, 
            fields: mediaFields,
            include: posts.map((p) => { if(p.featured_media){return p.featured_media } })
        }, 
        'media'
    );

    // before we can upload media files.
    for( let mediaObj of [].concat( attachedMedia, featuredMedia ) ){
        // generate a blob from the media object source_url.
        const mediaBlob = await axios.request( 
            {
                ...fromOptions,
                url: mediaObj.source_url,
                responseType: 'arraybuffer'
            } 
        ).then( (img) => {  return new Blob([img.data]) });
        
        mediaObj.data = mediaBlob;
    }

    // create media attachments
    spinner.text = `Uploading media files to ${to.url}`;
    //await createTaxonomies([].concat( attachedMedia, featuredMedia ), toOptions, 'media', spinner)

    // get all menus
    let menus = await getTaxonomies({
        ...fromOptions,
        fields: [
            'id',
            'description',
            'name',
            'slug',
            'meta',
            'locations'
        ]
    }, 'menus').then((navs) =>{
        // filter out any menus not assigned to a location.
        return navs.filter((menu) => { 
            return menu.locations.length 
        });
    })

    // create menus
    await createTaxonomies(menus, toOptions, 'menus', spinner);


};

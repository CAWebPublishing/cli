# caweb.json  Configuration  
Under the `sync` property you can list the various WordPress Instances. Each Instance, requires a WordPress Username, Application Password and the Site URL.

Sync Example Command:  
Using the example, if you wanted to sync all the changes from the dev instance to your local instance.  
`caweb sync dev local`  

Sync Configuration Example:  
<pre>
{
    "sync": {
        "local": {
            "user": "&lt;Username&gt;",
            "pwd": "<a href="https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/#basic-authentication-with-application-passwords">Application Password</a>",
            "url": "http://example1.com"
        },
        "dev": {
            "user": "&lt;Username&gt;",
            "pwd": "<a href="https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/#basic-authentication-with-application-passwords">Application Password</a>",
            "url": "http://example2.com"
        },
        "test": {
            "user": "&lt;Username&gt;",
            "pwd": "<a href="https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/#basic-authentication-with-application-passwords">Application Password</a>",
            "url": "http://example3.com"
        }
    }
}
</pre>

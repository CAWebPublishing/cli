## Global Installation
Allows for the `caweb` command to be available globally 
<pre>npm install -g @caweb/cli</pre>

## Local Installation
Recommended installation for projects.
<pre>npm install @caweb/cli</pre>

To run the `caweb` command from your project add the following script to your projects `package.json`.
<pre>
"scripts": {
    "caweb": "caweb"
}
</pre>

## Best first steps...
Running `npm run caweb gen-scripts` adds some general basic scripts commonly used in most projects to your package.json.

## Let's create a site
The following command will prompt you a series of questions, once completed a caweb.json file will be created. **This file should not be modified manually.**
<pre>npm run create-site</pre>

Once the file has been created, run the following command to serve your site:
<pre>npm run serve</pre> 

## You've created the perfect site, what now?
Let's see if we can convert the site into a CAWebPublishing WordPress Instance.
<pre>npm run convert-site</pre>

## Everything converted successfully...
Ok so lets launch your CAWebPublishing WordPress Instance.
<pre>npm run launch:sync</pre>
**\* Requirement:**  
- You must have Docker installed and running in order for this to work.
- As of date, CAWebPublishing requires Divi in order to function properly on WordPress
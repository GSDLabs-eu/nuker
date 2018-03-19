# FormData load tester for Node
Command line tool to measure and display API response times for FormData requests.

## Usage:
1) Clone the repo and run `npm install -g`, so you can use the 'loadtest' command.

2) Run `loadtest` and specify the target server's hostname, path if required, and some kind of form data (files and/or key-value pairs). You can either do this with command line arguments, or may use a config file.


Command line:

The following arguments are available:
* -h    **Hostname**    [Mandatory] Specify the hostname (e.g.: `-h http://localhost:port`, `-h https://myhost`, `-h myhost:port`)
* -p    **Path**        Specify the endpoint path (e.g.: `-p path/morepath`)
* -q    **Query**       Add (multiple) query parameters in `key=value` format (e.g.: `-q wait=3000 -q responseCode=404`)
* -m    **Method**      Request method (e.g.: `-m POST`)
* -f    **Form field**  Add form field(s) (`-f field=value -f anotherfield=anothervalue`)
* -F    **Form file**   Path of the file(s) to append if you are sending FormData (`-F file=image.jpg`, where 'file' will be the field in the FormData and 'image.jpg' is the file path)
* -b    **Body text**   Text that you want to add to the request body as a string (e.g.: `-b "this might be a JSON as well"`)
* -B    **Body path**   If you want to add a binary file as a body, specify the path here (e.g.: `-B examples/example.txt`)
* -c    **Count**       Number of requests to send, default is 10
* -d    **Duration**    Duration of the test in seconds, default is 10
* **--verbose**         Extended logging during execution
* **--outpath**         Specify the path of the output file (e.g.: `--outpath folder/filename.html`). Folder must exist in your file system.
* **--header**          Specify headers to send the request with (e.g.: `-h Accept-Charset=utf-8, -h Accept-Language: en-US`)


Config file:

Same options as command line arguments, stored in a JSON. See in 'examples' folder.
Run with `loadtest --config ./examples/config.json`
`--verbose` is also available when using a config file.

3) Results will be logged to a results.html file in the root directory.


## Test server:

The repo contains a basic test server with configurable response times and codes.
Use `npm run server` to start on `localhost:4343`.

You can configure the responses with query strings, e.g. `?wait=3000&responseCode=202` will delay a 202 response by 3000ms. If not specified otherwise, a 200 response will be returned.

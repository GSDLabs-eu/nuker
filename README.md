# FormData load tester for Node
Command line tool to measure and display API response times for FormData requests.

## Usage:
1) Clone the repo and run `npm install -g`, so you can use the 'loadtest' command.

2) Run `loadtest` and specify the target server's hostname, path, and some kind of form data (files and/or key-value pairs). You can either do this with command line arguments, or you may use a config file.


Command line:

The following arguments are available:

* -h    Hostname    Specify the hostname (e.g.: `http://localhost:port`, `https://myhost`, `myhost:port`)
* -p    Path        Specify the endpoint path (e.g.: `path`, or `/path/morepath`)
* -f    File        Path to the file(s) to append to the FormData. (`-f file=image.jpg`, where 'file will be the key in the FormData and image.jpg is the file path')
* -k    Key-value   Key/value pair(s) (`-k key=value -k anotherkey=anothervalue`)
* -m    Method      [Optional] Request method, default is 'POST'
* -c    Count       [Optional] Number of requests to send, default is 10
* -d    Duration    [Optional] Duration of the test in seconds, default is 10
* --verbose         [Optional] Extended logging during execution

To use multiple files or key-value pairs, just duplicate the argument. e.g.: `-f file=image.jpg -f file2=image2.jpg`


Config file:

Config is a JSON file, storing the same variables that would otherwise be input via the command line. An example file is provided in the project root folder, you should simply edit that one.
You can run the load tests with the JSON file using `loadtest --config path/to/config.json`
`--verbose` is also available when using a config file.

3) Results will be logged to a results.html file in the root directory.
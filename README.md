#Loadtest
Command line tool to measure and display API response times for FormData requests.

#Usage:
1) Clone the repo and run `npm install -g`
2) Run `loadtest` with the following arguments. Specifying a hostname, path and either at least one file path or key/value pair is mandatory. To use multiple files or multiple key/value pairs, just use the argument again, e.g.: `-f image.jpg -f image2.jpg`

    -h Hostname         Specify the hostname (without http://)
    -p Path             Specify the path (without /)
    -f File             [EITHER, OR BOTH] Path of the file(s) to append to form data. (`-f file=image.jpg`, where 'file will be the key in the FormData and image.jpg is the relative file path')
    -k Key/value pair   [EITHER, OR BOTH] Key/value pair(s) (`-k key=value`)
    -m Method           [OPTIONAL] Request method, default is POST
    -c Count            [OPTIONAL] Number of requests to send, default is 10
    -d Duration         [OPTIONAL] Duration of the test in seconds, default is 10


3) Results will be logged to a results.html file in the root directory.
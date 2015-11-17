var http = require('http');
var fs = require('fs');

// This is a simple node HTTP server to serve up files from this directory.
// Basically, since we're using the in-browser JSX transformer from Facebook,
// our JSX file needs to be served from an HTTP server to avoid cross-origin issues.

var port = 8082;
console.log('Starting server on port ' + port);

http.createServer(function(req, res) {
    var filePath = '.' + req.url;
    console.log('Retrieving ' + filePath);
    fs.readFile(filePath, function(err, file) {
        if (err) {
            console.log(err);
            res.writeHeader(204);
        } else {
            var contentType = 'text/html';
            var re = /(?:\.([^.]+))?$/;
            var ext = re.exec(filePath)[1];
            console.log('\text is ' + ext);
            if (ext == 'js') {
                contentType = 'text/javascript';
            } else if (ext == 'jsx') {
                contentType = 'text/jsx';
            } else if (ext == 'css') {
                contentType = 'text/css';
            }

            console.log('\tcontent-type: ' + contentType);

            res.writeHeader(200, { 'Content-Type': contentType });
            res.write(file);
        }
        res.end();
    });
}).listen(port);
var fs = require('fs');

// This is a simple node HTTP server to serve up files from this directory.
// Basically, since we're using the in-browser JSX transformer from Facebook,
// our JSX file needs to be served from an HTTP server to avoid cross-origin issues.

function handleHTTP(req, res) {
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
}

function handleIO(socket) {
    var interval = setInterval(function() {
        socket.emit('heartbeat', Math.random());
    }, 1000);

    function disconnect() {
        console.log('client disconnected');
        clearInterval(interval);
    }

    console.log('client connected');
    socket.on('disconnect', disconnect);

    socket.on('blocks', function(blockStates) {
        socket.broadcast.emit('blocks', blockStates);
    });
}

var host = 'localhost';
var port = 8082;
console.log('Starting server on port ' + port);

var http = require('http');
var httpServer = http.createServer(handleHTTP).listen(port, host);

var io = require('socket.io').listen(httpServer);
io.on('connection', handleIO);

io.configure(function() {
    io.enable('browser client minification');
    io.enable('browser client etag');
    io.set('log level', 1);
    io.set('transports', [
        'websocket',
        'xhr-polling',
        'jsonp-polling'
    ]);
});

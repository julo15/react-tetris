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

    var userId = generateUserId();
    socket.emit('id', userId);

    function disconnect() {
        console.log('client disconnected');
        clearInterval(interval);
        socket.broadcast.emit('disconnect', userId);
    }

    console.log('client connected');
    socket.on('disconnect', disconnect);

    socket.on('blocks', function(data) {
        socket.broadcast.emit('blocks', data);
    });

    socket.on('name', function(name) {
        socket.broadcast.emit('name', {
            userId: userId,
            name: name
        });
    });

    socket.on('score', function(score) {
        console.log('score received from ' + userId + ' (' + score + ')');
        socket.broadcast.emit('score', {
            userId: userId,
            score: score
        });
    });
}

function generateUserId() {
    return Math.floor(Math.random() * 1000);
}

var port = 8087;
console.log('Starting server on port ' + port);

var http = require('http');
var httpServer = http.createServer(handleHTTP).listen(port);

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

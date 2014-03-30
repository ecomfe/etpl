var http = require('http');


var CONTENT_TYPE = {
    html: 'text/html',
    js: 'text/javascript',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png'
};

var path = require('path');
var fs = require('fs');

http.createServer(
    function (request, response) {
        var url = (request.url.replace('/','') || 'index.html').replace(/\?.*$/, '');
        var contentType = url.slice( url.lastIndexOf('.') + 1 );

        var resFile = path.resolve( __dirname, url );
        if ( fs.existsSync( resFile ) ) {
            response.writeHead( 200, {'Content-Type': CONTENT_TYPE[ contentType ] } );
            response.write( fs.readFileSync( resFile ) );
            response.end();
        }
        else {
            response.statusCode = 404;
            response.end();
        }
    }
).listen(9999);

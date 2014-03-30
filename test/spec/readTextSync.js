(function () {
    var isBrowser = typeof window != 'undefined' && typeof navigator != 'undefined';

    function readTextSync( path ) {
        function parseText( content ) {
            var lines = content.replace(/\r?\n/g, '\n').split( '\n' );
            var result = {};

            var itemName;
            var buf = [];
            function flushItem() {
                if ( itemName ) {
                    result[ itemName ] = buf.join( '\n' );
                }
            }

            for ( var i = 0; i < lines.length; i++ ) {
                var line = lines[ i ];

                if ( /^\s*::\s*([a-z0-9_-]+)\s*::\s*$/i.test( line ) ) {
                    flushItem();

                    itemName = RegExp.$1;
                    buf = [];
                }
                else {
                    buf.push( line );
                }
            }

            flushItem();
            return result;
        }

        if ( isBrowser ) {
            var xhr = window.XMLHttpRequest 
                ? new XMLHttpRequest() 
                : new ActiveXObject( 'Microsoft.XMLHTTP' );
            xhr.open( 'GET', 'spec/' + path, false );
            xhr.send( null );

            if ( xhr.status >= 200 && xhr.status < 300 ) {
                return parseText( xhr.responseText );
            }
        }
        else {
            var fs = require( 'fs' );
            return parseText( 
                fs.readFileSync( 
                    require( 'path' ).resolve( __dirname, path ), 
                    'UTF8'
                )
            );
        }

        return null;
    }

    if ( isBrowser ) {
        window.readTextSync = readTextSync;
    }
    else {
        module.exports = exports = readTextSync;
    }
})();





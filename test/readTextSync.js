define(
    function () {
        return function ( path ) {
            var xhr = window.XMLHttpRequest 
                ? new XMLHttpRequest() 
                : new ActiveXObject( 'Microsoft.XMLHTTP' );
            xhr.open( 'GET', path, false );
            xhr.send( null );

            if ( xhr.status >= 200 && xhr.status < 300 ) {
                var lines = xhr.responseText.replace(/\r?\n/g, '\n').split( '\n' );
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

            return null;
        }
    }
);
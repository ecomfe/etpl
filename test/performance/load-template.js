function loadTemplate( url ) {
    var xhr = window.XMLHttpRequest 
        ? new XMLHttpRequest() 
        : new ActiveXObject( 'Microsoft.XMLHTTP' );
    xhr.open( 'GET', url, false );
    xhr.send( null );

    if ( xhr.status >= 200 && xhr.status < 300 ) {
        return xhr.responseText;
    }

    return '';
}
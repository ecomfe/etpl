var loops = 100;

if ( /^\?([0-9]+)\*([0-9]+)/.test(location.search) ) {
    loops = parseInt( RegExp.$2, 10 );
}
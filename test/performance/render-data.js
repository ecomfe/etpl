var data = { persons: [] };
(function () {
    var len = 10000;
    if ( /^\?([0-9]+)\*([0-9]+)/.test(location.search) ) {
        len = parseInt( RegExp.$1, 10 );
    }

    for ( var i = 0; i < len; i++ ) {
        data.persons.push( { 
            name: '<myname' + i,
            email: 'myname' + i + '@myemail.com',
            age: i + 5
        } )
    }
})();
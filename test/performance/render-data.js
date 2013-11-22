var data = { persons: [] };
(function () {
    for ( var i = 0; i < 10000; i++ ) {
        data.persons.push( { 
            name: '<myname' + i,
            email: 'myname' + i + '@myemail.com',
            age: i + 5
        } )
    }
})();
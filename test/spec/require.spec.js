(function (){

    var etpl = require( '../../src/main' );
    var readText = require( './readTextSync' );
    var text = readText( 'require.text.html' );

    describe('Require', function() {
        it(
            'should parse named require',
            function() {
                var context = etpl.compileAsModule(text['require-named']);
                console.log(context);
            }
        );
    });
})();

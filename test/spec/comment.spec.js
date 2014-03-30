(function (){

    var etpl = require( '../../src/main' );
    var readText = require( './readTextSync' );
    var text = readText( 'comment.text.html' );

    describe('Comment', function() {
        it('should not included on render', function() {
            var renderer = etpl.compile( text['tpl-comment'] );
            expect(renderer()).toEqual(text['expect-comment']);
        });

        it('start not matched should be as normal text', function() {
            var renderer = etpl.compile( text['tpl-simple'] );
            expect(renderer()).toEqual(text['expect-simple']);
        });
    });
    
})();
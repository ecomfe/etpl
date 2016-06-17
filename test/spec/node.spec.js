(function (){

    var etpl = require( '../../src/node' );
    etpl.config({
        dir: __dirname
    });

    var data = {name: 'errorrik'};
    var readText = require( './readTextSync' );
    var text = readText( 'node.spec.text' );

    describe('Node env', function() {
        it('can load the import target automatically', function() {
            var renderer = etpl.load('node/main');
            expect(renderer(data)).toEqual(text['expect-main']);
        });

        it('can load the master target automatically', function() {
            var renderer = etpl.load('node/master-main');
            expect(renderer(data)).toEqual(text['expect-master-main']);
        });

    });

})();

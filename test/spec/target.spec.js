(function (){

    var etpl = require( '../../src/main' );
    var readText = require( './readTextSync' );
    var text = readText( 'target.text.html' );

    describe('Target', function() {
        it('not exist should return undefined when be getted', function() {
            expect(etpl.getRenderer('noExist')).toBeUndefined();
        });

        it('should parse correctly when closed manually', function() {
            var render = etpl.compile(text['tpl-closed-manually']);
            expect(render()).toEqual(text['expect-closed-manually']);
            expect(render).toBe(etpl.getRenderer('targetClosedManually'));
        });

        it('should parse correctly when auto closed', function() {
            var render = etpl.compile(text['tpl-autoclose']);
            expect(render()).toEqual(text['expect-autoclose']);
            expect(render).toBe(etpl.getRenderer('targetAutoClose'));
        });

        it('parse empty string should return a renderer which return empty string ""', function() {
            expect(etpl.compile('')()).toEqual('');
        });
    });

})();

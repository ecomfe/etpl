(function (){

    var etpl = require( '../../src/main' );

    describe('No Target', function() {
        it('should return undefined', function() {
            expect(etpl.getRenderer('noExist')).toBeUndefined();
        });
    });

})();
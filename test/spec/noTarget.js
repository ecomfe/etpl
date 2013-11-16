define(
    function (require) {
        var etpl = require( 'etpl' );

        describe('No Target', function() {
            it('should return undefined', function() {
                expect(etpl.getRenderer('noExist')).toBeUndefined();
            });
        });
    }
);
define(
    function (require) {
        var etpl = require( 'etpl' );
        var readText = require( 'readTextSync' );
        var text = readText( 'spec/manyTargets.text.html' );

        var render = etpl.compile( text['tpl'] );

        describe('Many Targets', function() {
            it('should return renderer of first target', function() {
                expect(render).toBe(etpl.getRenderer('manyTargets-1'));
            });

            it('All renderers can be getted', function() {
                expect(typeof etpl.getRenderer('manyTargets-1')).toBe('function');
                expect(typeof etpl.getRenderer('manyTargets-2')).toBe('function');
                expect(typeof etpl.getRenderer('manyTargets-3')).toBe('function');
            });
        });
    }
);
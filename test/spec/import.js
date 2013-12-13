define(
    function (require) {
        var etpl = require( 'etpl' );
        var readText = require( 'readTextSync' );
        var text = readText( 'spec/import.text.html' );
        var data = {name: text.name};
        etpl.compile( text['simple'] );

        describe('Import', function() {
            it('can be used in target', function() {
                var renderer = etpl.getRenderer('importPara');
                expect(renderer(data)).toEqual(text['expect-importPara']);
            });

            it('can be used in master applyed, both content and contentplaceholder', function() {
                var renderer = etpl.getRenderer('importMasterTarget');
                expect(renderer(data)).toEqual(text['expect-importMasterTarget']);
            });

            it('When dependence unready, getRenderer should return null. Renderer can be getted when dependence ready.', function() {
                var renderer = etpl.getRenderer('importMasterTarget2');
                expect(renderer).toBeNull();

                etpl.compile( text['other-imported'] );
                renderer = etpl.getRenderer('importMasterTarget2');
                expect(typeof renderer).toBe('function');
                expect(renderer(data)).toBe(text['expect-importMasterTarget2']);
            });
        });
    }
);
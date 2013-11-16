define(
    function (require) {
        var etpl = require( 'etpl' );
        var readText = require( 'readTextSync' );
        var text = readText( 'spec/for.text.html' );
        var data = {
            myList: eval(text.myList),
            persons: eval(text.persons)
        };
        etpl.compile( text.tpl );

        describe('Array traversal', function() {
            it('can read "item" variable', function() {
                var renderer = etpl.getRenderer('forItemTarget');
                expect(renderer(data)).toEqual(text['expect-forItemTarget']);
            });

            it('can read "item" and "index" variables', function() {
                var renderer = etpl.getRenderer('forItemIndexTarget');
                expect(renderer(data)).toEqual(text['expect-forItemIndexTarget']);
            });

            it('can use property accessor', function() {
                var renderer = etpl.getRenderer('forItemPropertyAccessTarget');
                expect(renderer(data)).toEqual(text['expect-forItemPropertyAccessTarget']);
            });
        });
    }
);
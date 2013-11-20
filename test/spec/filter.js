define(
    function (require) {
        var etpl = require( 'etpl' );
        var readText = require( 'readTextSync' );
        var text = readText( 'spec/filter.text.html' );

        describe('Filter', function() {
            it('can filter a piece of text', function() {
                var renderer = etpl.compile( text['tpl-simple'] );
                expect(renderer()).toEqual(text['expect-simple']);
            });

            it('can be nested', function() {
                var renderer = etpl.compile( text['tpl-nested'] );
                expect(renderer()).toEqual(text['expect-nested']);
            });

            it('param can be passed', function() {
                etpl.addFilter( 'filter-lower', function (source, saveInitial) {
                    if (saveInitial) {
                        return source.charAt(0) + source.slice(1).toLowerCase();
                    }
                    return source.toLowerCase();
                });
                var renderer = etpl.compile( text['tpl-param'] );
                expect(renderer()).toEqual(text['expect-param']);
            });
        });
    }
);
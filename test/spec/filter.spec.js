(function (){

    var etpl = require( '../../src/main' );
    var readText = require( './readTextSync' );
    var text = readText( 'filter.text.html' );

    etpl.addFilter( 'filter-lower', function (source, saveInitial) {
        if (saveInitial) {
            return source.charAt(0) + source.slice(1).toLowerCase();
        }
        return source.toLowerCase();
    });

    etpl.addFilter( 'filter-not', function (source) {
        return !source;
    });

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
            var renderer = etpl.compile( text['tpl-param'] );
            expect(renderer()).toEqual(text['expect-param']);
        });

        it('param can use variable', function() {
            var renderer = etpl.compile( text['tpl-param-variable'] );
            expect(renderer()).toEqual(text['expect-param']);
        });

        it('param can use variable which has filter', function() {
            var renderer = etpl.compile( text['tpl-param-variable-filter'] );
            expect(renderer()).toEqual(text['expect-param']);
        });

        it('command literal allow break line', function() {
            var renderer = etpl.compile( text['tpl-param-break-line'] );
            expect(renderer()).toEqual(text['expect-param']);
        });

        it('has block in body, child target can override block content', function() {
            var renderer = etpl.compile( text['tpl-block'] );
            expect(renderer({prod:'etpl'})).toEqual(text['expect-block-etpl']);
            expect(renderer({prod:'er'})).toEqual(text['expect-block-er']);
        });
    });
})();

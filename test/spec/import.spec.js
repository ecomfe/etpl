(function (){

    var etpl = require( '../../src/main' );
    var readText = require( './readTextSync' );
    var text = readText( 'import.text.html' );
    var data = {name: text.name};

    describe('Import', function() {
        it('can be used in target', function() {
            var renderer = etpl.compile(text['tpl-para']);
            expect(renderer(data)).toEqual(text['expect-para']);
        });

        it('can be used in target which close manually', function() {
            var renderer = etpl.compile(text['tpl-hasclose']);
            expect(renderer(data)).toEqual(text['expect-hasclose']);
        });

        it('can be used in if command', function() {
            var renderer = etpl.compile(text['tpl-inif']);
            expect(renderer(data)).toEqual(text['expect-inif']);
        });

        it('can be used in for command', function() {
            var renderer = etpl.compile(text['tpl-infor']);
            expect(renderer(data)).toEqual(text['expect-infor']);
        });

        it('can be used in master applyed', function() {
            var renderer = etpl.compile(text['tpl-master']);
            expect(renderer(data)).toEqual(text['expect-master']);
        });

        it('When dependence unready, getRenderer should return null. Renderer can be getted when dependence ready.', function() {
            var renderer = etpl.compile(text['tpl-unready-begin']);
            expect(renderer).toBeNull();

            etpl.compile(text['tpl-unready-then']);
            renderer = etpl.getRenderer('importUnready');
            expect(typeof renderer).toBe('function');
            expect(renderer(data)).toBe(text['expect-unready']);
        });

        it('can override block which declared in target', function() {
            var renderer = etpl.compile(text['tpl-block']);
            expect(renderer()).toEqual(text['expect-block']);
        });

        it('and override block, the own target can be extended', function() {
            var renderer = etpl.compile(text['tpl-mix']);
            expect(renderer()).toEqual(text['expect-mix-target']);

            renderer = etpl.getRenderer('importMixMaster');
            expect(renderer()).toEqual(text['expect-mix-master']);
        });
    });

})();

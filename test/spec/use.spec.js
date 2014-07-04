(function (){

    var etpl = require( '../../src/main' );
    var readText = require( './readTextSync' );
    var text = readText( 'use.text.html' );
    var data = {
        persons: eval(text['data-persons']),
        engine: text['data-engine']
    };
    etpl.compile( text.tpl );

    etpl.addFilter('use-prefix', function (source, prefix) {
        prefix = prefix || 'sb';
        return prefix + '-' + source;
    });

    describe('Use', function() {
        it('can pass arguments to call a target', function() {
            var renderer = etpl.getRenderer('useSimpleTarget');
            expect(renderer(data)).toEqual(text['expect-useSimpleTarget']);
        });

        it('command literal allow break line', function() {
            var renderer = etpl.getRenderer('useSimpleTargetBreakLine');
            expect(renderer(data)).toEqual(text['expect-useSimpleTarget']);
        });

        it('can not read data of caller', function() {
            var renderer = etpl.getRenderer('useEngineTarget');
            expect(renderer(data)).toEqual(text['expect-useEngineTarget']);
        });

        it('When dependence unready, getRenderer should return null. Renderer can be getted when dependence ready.', function() {
            etpl.compile(text['tpl-dep-target']);
            var renderer = etpl.getRenderer('useDepTarget');
            expect(renderer).toBeNull();

            etpl.compile(text['tpl-dep-master'])
            renderer = etpl.getRenderer('useDepTarget');
            expect(renderer(data)).toEqual(text['expect-useDepTarget']);
        });

        it('yourself should be allowed (recursion)', function() {
            etpl.compile(text['tpl-recursion'])
            var renderer = etpl.getRenderer('useRecursionTarget');
            expect(renderer(eval(text['data-recursion'])))
                .toEqual(text['expect-useRecursionTarget']);
        });

        it('can use filter to process arguments', function() {
            var renderer = etpl.getRenderer('useSimpleFilterTarget');
            expect(renderer(data)).toEqual(text['expect-useSimpleFilterTarget']);
        });

        it('can pass args when use filter to process arguments', function() {
            var renderer = etpl.getRenderer('useSimpleFilterArgTarget');
            expect(renderer(data)).toEqual(text['expect-useSimpleFilterArgTarget']);
        });
    });
        
})();
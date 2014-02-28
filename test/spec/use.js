define(
    function (require) {
        var etpl = require( 'etpl' );
        var readText = require( 'readTextSync' );
        var text = readText( 'spec/use.text.html' );
        var data = {
            persons: eval(text['data-persons']),
            engine: text['data-engine']
        };
        etpl.compile( text.tpl );

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
        });
        
    }
);
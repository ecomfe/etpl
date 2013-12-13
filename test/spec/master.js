define(
    function (require) {
        var etpl = require( 'etpl' );

        var readText = require( 'readTextSync' );
        var text = readText( 'spec/master.text.html' );

        var simpleRenderer = etpl.compile( text.simple );
        var simple2Renderer = etpl.compile( text.simple2 );

        describe('Master', function() {
            it(
                'can be applied to target', 
                function() {
                    expect(simpleRenderer()).toEqual(text[ 'expect-simple' ]);
                    expect(simple2Renderer()).toEqual(text[ 'expect-simple2' ]);
                }
            );
            it(
                'Use contentplaceholder`s content when not be replaced', 
                function() {
                    var renderer = etpl.compile( text['default-cph'] );
                    expect(renderer()).toEqual(text[ 'expect-default-cph' ]);
                }
            );
            it(
                'can be applied to master', 
                function() {
                    var renderer = etpl.compile( text['applyto-master'] );
                    expect(etpl.getRenderer('masterChildTargetNoContent')())
                        .toEqual(text[ 'expect-masterChildTargetNoContent' ]);
                    expect(etpl.getRenderer('masterChildTargetBodyContent')())
                        .toEqual(text[ 'expect-masterChildTargetBodyContent' ]);
                    expect(etpl.getRenderer('masterChildTargetBHContent')())
                        .toEqual(text[ 'expect-masterChildTargetBHContent' ]);
                }
            );
            it(
                'Target extends uncompiled master will return null. After master compiled, renderer canbe getted.', 
                function() {
                    var renderer = etpl.compile( text['lazy-target'] );
                    expect(renderer).toBeNull();

                    etpl.compile( text['lazy-master'] );
                    renderer = etpl.getRenderer('masterLazyTarget');
                    expect(typeof renderer).toBe('function');
                    expect(renderer()).toBe(text['expect-lazy-target']);
                }
            );
        });
    }
);
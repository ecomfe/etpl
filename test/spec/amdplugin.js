define(
    function (require) {
        var tplSource = require( 'etpl/tpl!spec/amdplugin.text.html' );
        var plugin = require( 'etpl/tpl' );
        var etpl = require( 'etpl' );

        describe('AMD Plugin', function() {
            it(
                '"normalize" method can transform relative path to absolute', 
                function() {
                    expect(plugin.normalize('a/b/c.html'))
                        .toEqual('/a/b/c.html');
                    expect(plugin.normalize('../../a/b/c.html'))
                        .toEqual('/a/b/c.html');
                    expect(plugin.normalize('../../a/../b/c.html'))
                        .toEqual('/b/c.html');
                    expect(plugin.normalize('a/b/c/././../../a/../b/c.html'))
                        .toEqual('/a/b/c.html');
                }
            );

            it(
                '"normalize" method will do nothing when met url which has protocol', 
                function() {
                    expect(plugin.normalize('http://www.baidu.com/aa'))
                        .toEqual('http://www.baidu.com/aa');
                    expect(plugin.normalize('https://www.baidu.com/'))
                        .toEqual('https://www.baidu.com/');
                }
            );

            it(
                'load template file and auto compile success', 
                function() {
                    expect(etpl.render('amdpluginTarget'))
                        .toEqual('Hello AMD Plugin!');
                    expect(tplSource)
                        .toEqual('<!-- target: amdpluginTarget -->Hello AMD Plugin!');
                }
            );


        });
    }
);
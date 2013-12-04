define(
    function (require) {
        var tplSource = require( 'etpl/tpl!spec/amdplugin.text.html' );
        var tplSourceRelative = require( 'etpl/tpl!./amdplugin-relative.text.html' );
        var tplSourceAbsolute = require( 'etpl/tpl!/spec/amdplugin-absolute.text.html' );
        var plugin = require( 'etpl/tpl' );
        var etpl = require( 'etpl' );

        describe('AMD Plugin', function() {
            it(
                'load template file and auto compile success', 
                function() {
                    expect(etpl.render('amdpluginTarget'))
                        .toEqual('Hello AMD Plugin!');
                    expect(tplSource)
                        .toEqual('<!-- target: amdpluginTarget -->Hello AMD Plugin!');
                }
            );

            it(
                'load template file and auto compile success when resource id use relative id', 
                function() {
                    expect(etpl.render('amdpluginRelativeTarget'))
                        .toEqual('Hello AMD Plugin from relative!');
                    expect(tplSourceRelative)
                        .toEqual('<!-- target: amdpluginRelativeTarget -->Hello AMD Plugin from relative!');
                }
            );

            it(
                'load template file and auto compile success when resource id use absolute path', 
                function() {
                    expect(etpl.render('amdpluginAbsoluteTarget'))
                        .toEqual('Hello AMD Plugin from absolute!');
                    expect(tplSourceAbsolute)
                        .toEqual('<!-- target: amdpluginAbsoluteTarget -->Hello AMD Plugin from absolute!');
                }
            );


        });
    }
);
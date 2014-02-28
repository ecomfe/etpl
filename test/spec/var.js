define(
    function (require) {
        var etpl = require( 'etpl' );
        var readText = require( 'readTextSync' );
        var text = readText( 'spec/var.text.html' );

        describe('Var', function() {
            it('can declare user variable', function() {
                var renderer = etpl.compile( text['tpl-simple'] );
                expect(renderer()).toEqual(text['expect-simple']);
            });

            it('command literal allow break line', function() {
                var renderer = etpl.compile( text['tpl-breakline'] );
                expect(renderer()).toEqual(text['expect-breakline']);
            });

            it('has higher priority than data variable', function() {
                var data = {
                    name: 'etpl'
                };
                etpl.compile( text['tpl-prior'] );
                expect(etpl.render('varPriorNoVarTarget', data))
                    .toEqual(text['expect-prior-novar']);
                expect(etpl.render('varPriorVarTarget', data))
                    .toEqual(text['expect-prior-var']);
            });

            it('effective on declare position', function() {
                var data = {
                    name: 'etpl'
                };
                etpl.compile( text['tpl-ba'] );
                expect(etpl.render('varBATarget', data))
                    .toEqual(text['expect-ba']);
            });

            it('effective around the target', function() {
                etpl.compile( text['tpl-around'] );
                expect(etpl.render('varAroundTarget'))
                    .toEqual(text['expect-around']);
            });

            it('can be read when data has getter method', function() {
                etpl.compile( text['tpl-data-getter'] );
                expect(etpl.render('varDataGetterTarget', {get: function() {}}))
                    .toEqual(text['expect-data-getter']);
            });
        });
    }
);
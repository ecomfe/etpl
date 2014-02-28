define(
    function (require) {
        var etpl = require( 'etpl' );
        var readText = require( 'readTextSync' );
        var text = readText( 'spec/for.text.html' );
        var data = {
            myList: eval(text.myList),
            myObj: eval(text.myObj),
            persons: eval(text.persons),
            personsIndex: eval(text.personsIndex)
        };
        data.ecomfe = {
            persons: data.persons, 
            personsIndex: data.personsIndex
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

            it('can use property accessor in command tag', function() {
                var renderer = etpl.getRenderer('forItemCommandPropertyAccessTarget');
                expect(renderer(data)).toEqual(text['expect-forItemCommandPropertyAccessTarget']);
            });

            it('can use property accessor in traversal body', function() {
                var renderer = etpl.getRenderer('forItemPropertyAccessTarget');
                expect(renderer(data)).toEqual(text['expect-forItemPropertyAccessTarget']);
            });

            it('command literal allow break line', function() {
                var renderer = etpl.getRenderer('forItemIndexTargetBreakLine');
                expect(renderer(data)).toEqual(text['expect-forItemIndexTarget']);
            });
        });

        describe('Object traversal', function() {
            it('can read "item" variable', function() {
                var renderer = etpl.getRenderer('forOItemTarget');
                expect(renderer(data)).toEqual(text['expect-forOItemTarget']);
            });

            it('can read "item" and "key" variables', function() {
                var renderer = etpl.getRenderer('forOItemKeyTarget');
                expect(renderer(data)).toEqual(text['expect-forOItemKeyTarget']);
            });

            it('can use property accessor in command tag', function() {
                var renderer = etpl.getRenderer('forOItemCommandPropertyAccessTarget');
                expect(renderer(data)).toEqual(text['expect-forOItemCommandPropertyAccessTarget']);
            });

            it('can use property accessor in traversal body', function() {
                var renderer = etpl.getRenderer('forOItemPropertyAccessTarget');
                expect(renderer(data)).toEqual(text['expect-forOItemPropertyAccessTarget']);
            });
        });

        describe('Traversal', function() {
            it('can be nested', function() {
                var renderer = etpl.getRenderer('forNestedTarget');
                var result = renderer(data);
                expect(result.indexOf(text['except-nested-1'])).toBeGreaterThan(-1);
                expect(result.indexOf(text['except-nested-2'])).toBeGreaterThan(-1);
                expect(result.indexOf(text['except-nested-3'])).toBeGreaterThan(-1);
                expect(result.indexOf(text['except-nested-4'])).toBeGreaterThan(-1);
            });

            it('variable can be read when data has getter method', function() {
                var renderer = etpl.getRenderer('forDataGetterTarget');
                var dataHasGetter = {
                    get: function (name) {
                        return data[ name ];
                    }
                };
                var result = renderer(dataHasGetter);
                expect(result).toEqual(text['except-forDataGetterTarget']);
            });
        });
    }
);
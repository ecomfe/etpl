(function (){

    var etpl = require( '../../src/main' );
    var readText = require( './readTextSync' );
    var text = readText( 'if.text.html' );
    etpl.compile( text.tpl );

    etpl.addFilter('if-sum', function (source) {
        for (var i = 1; i < arguments.length; i++) {
            source += arguments[i];
        }

        return source;
    });

    describe('Conditional', function() {
        it('use "if-elif-else" should be render correctly', function() {
            var renderer = etpl.getRenderer('ifNumTarget');
            expect(renderer({num:1})).toEqual(text['expect-number-1']);
            expect(renderer({num:0})).toEqual(text['expect-number-0']);
            expect(renderer({num:-1})).toEqual(text['expect-number-invalid']);
        });

        it('use unary expr in "if" should be render correctly', function() {
            var renderer = etpl.getRenderer('ifUnaryTarget');
            expect(renderer( {num:1,str:"1"} )).toEqual(text['expect-ifUnaryTarget']);
        });

        it('use binary expr in "if" should be render correctly', function() {
            var renderer = etpl.getRenderer('ifBinaryTarget');
            expect(renderer( {num:1,str:"1"} )).toEqual(text['expect-ifBinaryTarget']);
        });

        it('use complex expr in "if" should be render correctly', function() {
            var renderer = etpl.getRenderer('ifComplexTarget');
            expect(renderer( {num:1,str:"1"} )).toEqual(text['expect-ifComplexTarget']);
        });

        it('can use complex property accessor in variable', function() {
            var renderer = etpl.getRenderer('ifComplexPropertyAccessTarget');
            expect(renderer( {level1: [ 1, {num:1} ] } )).toEqual(text['expect-ifComplexTarget']);
        });

        it('can use filter in variable when command if', function() {
            var renderer = etpl.compile(text['tpl-variable-filter-if']);
            expect(renderer()).toEqual(text['expect-variable-filter-if']);
        });

        it('can use filter in variable when command elif', function() {
            var renderer = etpl.compile(text['tpl-variable-filter-elif']);
            expect(renderer()).toEqual(text['expect-variable-filter-elif']);
        });

        it('command literal allow break line', function() {
            var renderer = etpl.getRenderer('ifComplexTargetBreakLine');
            expect(renderer( {num:1,str:"1"} )).toEqual(text['expect-ifComplexTarget']);
        });

        it('has block in body, child target can override block content', function() {
            var renderer = etpl.getRenderer('ifBlockTarget');
            expect(renderer({cond: 'if'})).toEqual(text['expect-ifBlockTarget-if']);
            expect(renderer({cond: 'elif'})).toEqual(text['expect-ifBlockTarget-elif']);
            expect(renderer({cond: 'else'})).toEqual(text['expect-ifBlockTarget-else']);
        });

        it('"if" can be nested', function() {
            var renderer = etpl.getRenderer('ifNestedTarget');
            expect(renderer( {num:1,str:"1"} ))
                .toEqual(text['expect-ifNestedTarget-samevalue']);
            expect(renderer( {num:2,str:"1"} ))
                .toEqual(text['expect-ifNestedTarget-differentvalue']);
        });
    });

})();

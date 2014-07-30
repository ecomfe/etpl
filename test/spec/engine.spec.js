(function (){

    var etpl = require( '../../src/main' );
    var readText = require( './readTextSync' );
    var mytpl = new etpl.Engine();
    var text = readText( 'engine.text.html' );

    etpl.addFilter( 'engine-upper', function ( source ) {
        return source.toUpperCase();
    } );

    etpl.addFilter( 'engine-upper2', function ( source, initial ) {
        if (initial) {
            return source.charAt(0).toUpperCase() + source.slice( 1 );
        }

        return source.toUpperCase();
    } );

    mytpl.addFilter( 'engine-upper', function ( source ) {
        return source.toUpperCase();
    } );

    mytpl.addFilter( 'engine-upper2', function ( source, initial ) {
        if (initial) {
            return source.charAt(0).toUpperCase() + source.slice( 1 );
        }

        return source.toUpperCase();
    } );

    describe('Engine', function() {
        it('can new by manual, isolate from default engine', function() {
            etpl.compile(text['default-tpl']);
            mytpl.compile(text['myengine-tpl']);
            expect(etpl.getRenderer('engineTarget')())
                .toEqual(text['expect-default']);
            expect(mytpl.getRenderer('engineTarget')())
                .toEqual(text['expect-myengine']);
        });

        it('compile target which exists should throw error', function() {
            try{
                etpl.compile(text['repeat-tpl']);
                etpl.compile(text['repeat-tpl']);
                expect(false).toBeTruthy();
            }
            catch (ex) {
                var msg = ex.message;
                if ( /^target exists/i.test(msg) ) {
                    expect(true).toBeTruthy();
                }
                else {
                    expect(false).toBeTruthy();
                }
            }
        });

        it('"config" method can setup command open and close', function() {
            mytpl.config({
                commandOpen: '<%',
                commandClose: '%>'
            });
            mytpl.compile(text['custom-options']);
            expect(mytpl.getRenderer('engineCustomTarget')())
                .toEqual(text['expect-custom-options']);
            expect(mytpl.getRenderer('engineTarget')())
                .toEqual(text['expect-myengine']);
            mytpl.config({
                commandOpen: '<!--',
                commandClose: '-->'
            });
        });

        it('"config" method can setup command syntax', function() {
            mytpl.config({
                commandSyntax: /^\s*(\/)?([a-z]+)\s?([\s\S]*)$/,
                commandOpen: '<%',
                commandClose: '%>',
                variableOpen: '{{',
                variableClose: '}}'
            });
            var render = mytpl.compile(text['custom-syntax']);
            expect(render()).toEqual(text['expect-custom-syntax']);
            mytpl.config({
                commandSyntax: /^\s*(\/)?([a-z]+)\s*(?::([\s\S]*))?$/,
                commandOpen: '<!--',
                commandClose: '-->',
                variableOpen: '${',
                variableClose: '}'
            });
        });

        it('"config" method can setup variable open and close', function() {
            mytpl.config({
                variableOpen: '{{',
                variableClose: '}}'
            });
            mytpl.compile(text['custom-variable']);
            expect(mytpl.getRenderer('engineCustomVariable')())
                .toEqual(text['expect-custom-variable']);
            mytpl.config({
                variableOpen: '${',
                variableClose: '}'
            });
        });

        it('"config" method can setup variable and command at the same time', function() {
            mytpl.config({
                commandOpen: '<%',
                commandClose: '%>',
                variableOpen: '{{',
                variableClose: '}}'
            });
            mytpl.compile(text['custom-command-variable']);
            expect(mytpl.getRenderer('engineCustomCommandVariable')())
                .toEqual(text['expect-custom-command-variable']);
            mytpl.config({
                commandOpen: '<!--',
                commandClose: '-->',
                variableOpen: '${',
                variableClose: '}'
            });
        });

        it('"config" method can setup default filter', function() {
            var data = {name: '<b>etpl</b>'};

            mytpl.compile(text['custom-filter-tpl']);
            expect(mytpl.render('engineCustomFilterTarget',data)).toEqual(text['expect-custom-filter-html']);

            mytpl.config({
                defaultFilter: ''
            });
            mytpl.compile(text['custom-filter-tpl2']);
            expect(mytpl.render('engineCustomFilterTarget2',data)).toEqual(text['expect-custom-filter-raw']);

            mytpl.config({
                defaultFilter: 'html'
            });
        });

        it('"config" method can setup naming conflict "ignore"', function() {
            mytpl.config({
                namingConflict: 'ignore'
            });

            mytpl.compile(text['repeat-tpl-ignore-first']);
            mytpl.compile(text['repeat-tpl-ignore-second']);
            expect(mytpl.render('engineRepeatIgnoreTarget')).toEqual('ignore');

            mytpl.config({
                namingConflict: 'error'
            });
        });

        it('"config" method can setup naming conflict "override"', function() {
            mytpl.config({
                namingConflict: 'override'
            });

            mytpl.compile(text['repeat-tpl-override-first']);
            mytpl.compile(text['repeat-tpl-override-second']);
            expect(mytpl.render('engineRepeatOverrideTarget')).toEqual('override');

            mytpl.config({
                namingConflict: 'error'
            });
        });

        it('"config" method can setup "strip" to clean break line and whiteletter before and after command', function() {
            mytpl.config({ strip: true });

            var render = mytpl.compile(text['strip-tpl']);
            expect(render(eval(text['strip-data']))).toEqual(text['strip-expect']);
            expect(mytpl.getRenderer('engineStripTargetSimple')())
                .toEqual(text['strip-simple-expect']);
            expect(mytpl.getRenderer('engineStripTargetIf')())
                .toEqual(text['strip-if-expect']);

            mytpl.config({ strip: false });
        });

        it('"render" method returns the same value as renderer call', function() {
            var renderer = mytpl.compile(text['variable-tpl']);
            var data = {
                info: {
                    name:'etpl',
                    contributor: 'errorrik'
                }
            };
            expect(renderer(data)).toEqual(mytpl.render('engineVariableTarget',data));
        });

        it('"render" method can receive both plain object and object by getter method', function() {
            var renderer = etpl.compile(text['data-tpl']);
            var data = eval(text['data']);
            var dataGetter = eval(text['data-getter'])
            expect(renderer(data)).toEqual(renderer(dataGetter));
        });

        it('"addFilter" method can add a filter function', function() {
            var renderer = etpl.compile(text['upper-tpl']);
            var data = {name: 'etpl'};
            expect(renderer(data))
                 .toEqual(text['expect-engineUpperTarget']);
        });

        it('"addFilter" method can add a filter function which can receive extra params', function() {
            var renderer = etpl.compile(text['upper-tpl2']);
            var data = {name: 'etpl'};
            expect(renderer(data))
                 .toEqual(text['expect-engineUpperTarget2']);
        });

        it('default instance: "parse" method should reserved for backward compatibility, same as "compile" method', function() {
            expect(etpl.parse).toBe(etpl.compile);
        });
    });

})();

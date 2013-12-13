define(
    function (require) {
        var etpl = require( 'etpl' );
        var mytpl = new etpl.Engine();
        var readText = require( 'readTextSync' );
        var text = readText( 'spec/engine.text.html' );
        etpl.compile( text['get-tpl'] );

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
                    if ( /^target /i.test(msg) && /is exists/.test(msg) ) {
                        expect(true).toBeTruthy();
                    }
                    else {
                        expect(false).toBeTruthy();
                    }
                }
            });

            it('compile master which exists should throw error', function() {
                try{
                    etpl.compile(text['repeat-master-tpl']);
                    etpl.compile(text['repeat-master-tpl']);
                    expect(false).toBeTruthy();
                }
                catch (ex) {
                    var msg = ex.message;
                    if ( /^master /i.test(msg) && /is exists/.test(msg) ) {
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

            it('"get" method should return the target content', function() {
                expect(etpl.get('engineGetSimpleTarget'))
                    .toEqual(text['expect-engineGetSimpleTarget']);
            });

            it('"get" method should return the target content which had mixed imports', function() {
                expect(etpl.get('engineGetImportTarget'))
                    .toEqual(text['expect-engineGetImportTarget']);
            });

            it('"get" method should return the target content which had applied master', function() {
                expect(etpl.get('engineGetMasterTarget'))
                    .toEqual(text['expect-engineGetMasterTarget']);
            });

            it('"addFilter" method can add a filter function', function() {
                etpl.addFilter( 'upper', function ( source ) {
                    return source.toUpperCase();
                } );
                var renderer = etpl.compile(text['upper-tpl']);
                var data = {name: 'etpl'};
                expect(renderer(data))
                     .toEqual(text['expect-engineUpperTarget']);
            });

            it('"addFilter" method can add a filter function which can receive extra params', function() {
                etpl.addFilter( 'upper2', function ( source, initial ) {
                    if (initial) {
                        return source.charAt(0).toUpperCase() + source.slice( 1 );
                    }

                    return source.toUpperCase();
                } );
                var renderer = etpl.compile(text['upper-tpl2']);
                var data = {name: 'etpl'};
                expect(renderer(data))
                     .toEqual(text['expect-engineUpperTarget2']);
            });

            it('default instance: "parse" method should reserved for backward compatibility, same as "compile" method', function() {
                expect(etpl.parse).toBe(etpl.compile);
            });
        });
    }
);
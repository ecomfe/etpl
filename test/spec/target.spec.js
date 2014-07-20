(function (){

    var etpl = require( '../../src/main' );
    var readText = require( './readTextSync' );
    var text = readText( 'target.text.html' );

    describe('Target', function() {
        it(
            'not exist should return undefined when be getted',
            function() {
                expect(etpl.getRenderer('noExist')).toBeUndefined();
            }
        );

        it(
            'should parse correctly when closed manually',
            function() {
                var render = etpl.compile(text['tpl-closed-manually']);
                expect(render()).toEqual(text['expect-closed-manually']);
                expect(render).toBe(etpl.getRenderer('targetClosedManually'));
            }
        );

        it(
            'should parse correctly when auto closed',
            function() {
                var render = etpl.compile(text['tpl-autoclose']);
                expect(render()).toEqual(text['expect-autoclose']);
                expect(render).toBe(etpl.getRenderer('targetAutoClose'));
            }
        );

        it(
            'parse empty string should return a renderer which return empty string ""',
            function() {
                expect(etpl.compile('')()).toEqual('');
            }
        );

        it(
            'compile method should return renderer of first target, and then all renderers can be getted',
            function() {
                var render = etpl.compile( text['tpl-many'] );

                expect(render).toBe(etpl.getRenderer('targetMany1'));
                expect(typeof etpl.getRenderer('targetMany1')).toBe('function');
                expect(typeof etpl.getRenderer('targetMany2')).toBe('function');
                expect(typeof etpl.getRenderer('targetMany3')).toBe('function');
                expect(etpl.getRenderer('targetMany1')()).toEqual(text['expect-many1']);
                expect(etpl.getRenderer('targetMany2')()).toEqual(text['expect-many2']);
                expect(etpl.getRenderer('targetMany3')()).toEqual(text['expect-many3']);
            }
        );

        it(
            'can be extends from master target',
            function() {
                var render = etpl.compile(text['tpl-simple-master']);
                expect(render()).toEqual(text['expect-simple-master']);

                render = etpl.compile(text['tpl-simple-master2']);
                expect(render()).toEqual(text['expect-simple-master2']);

                render = etpl.getRenderer('targetFromMasterSimple2Breakline');
                expect(render()).toEqual(text['expect-simple-master2']);
            }
        );

        it(
            'use master block content when not have block in self',
            function() {
                etpl.compile(text['tpl-master-default-block']);
                var render = etpl.getRenderer('targetFromDefaultBlock/Master');
                expect(render()).toEqual(text['expect-master-default-block']);
            }
        );

        it(
            'can be extends from target which extends from other parent target',
            function() {
                etpl.compile( text['tpl-ntier-master'] );
                expect(etpl.getRenderer('targetNTierNoContent')())
                    .toEqual(text[ 'expect-ntier-nocontent' ]);
                expect(etpl.getRenderer('targetNTierBodyContent')())
                    .toEqual(text[ 'expect-ntier-bodycontent' ]);
                expect(etpl.getRenderer('targetNTierBHContent')())
                    .toEqual(text[ 'expect-ntier-bhcontent' ]);
            }
        );

        it(
            'extends uncompiled master will return null. After master compiled, renderer canbe getted.',
            function() {
                var render = etpl.compile( text['tpl-lazy-target'] );
                expect(render).toBeNull();

                etpl.compile( text['tpl-lazy-master'] );
                render = etpl.getRenderer('targetFromLazyMaster');
                expect(typeof render).toBe('function');
                expect(render()).toBe(text['expect-lazy']);
            }
        );

        it(
            'block can be nested',
            function() {
                var render = etpl.compile(text['tpl-nested-block']);
                expect(render()).toEqual(text['expect-nested-block']);

                render = etpl.getRenderer('targetFromNestedBlockNoHeader');
                expect(render()).toEqual(text['expect-nested-block-noheader']);

                render = etpl.getRenderer('targetFromNestedBlockCustomBody');
                expect(render()).toEqual(text['expect-nested-block-custombody']);
            }
        );
    });

})();

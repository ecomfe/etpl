(function () {
    var tplText = document.getElementById( 'text-template' );
    var dataText = document.getElementById( 'text-data' );
    var resultText = document.getElementById( 'text-result' );

    tplText.value = 'Hello ${name}!';
    dataText.value = '{ "name": "ETPL" }';

    function tryRender() {
        var tpl = tplText.value;
        var data = dataText.value;

        var result = '';
        var engine = new etpl.Engine();
        var render;

        try {
            data = (new Function( 'return ' + data ))();
        }
        catch ( ex ) {
            result = 'invalid data';
        }

        try {
            render = engine.compile( tpl );
            if ( !render ) {
                result = 'no template';
            }
        }
        catch ( ex ) {
            result = ex.message;
        }

        if ( result ) {
            resultText.value = result;
            return;
        }

        try {
            resultText.value = render( data );
        }
        catch ( ex ) {
            resultText.value = ex.message;
        }
    }

    tryRender();
    tplText.onblur = dataText.onblur = tryRender;

    var tryCodes = {
        'if': {
            template: [
                '<!-- if: ${num} === ${str} -->',
                'same type and value',
                '<!-- elif: ${num} == ${str} -->',
                'different type same value',
                '<!-- else -->',
                'different value',
                '<!--/if-->'
            ].join( '\n' ),
            data: [
                '{',
                '  num: 1,',
                '  str: "1"',
                '}'
            ].join( '\n' )
        },
        'for': {
            template: [
                '<ul>',
                '<!-- for: ${persons} as ${person} -->',
                '    <li>${person.name}[${person.email}]</li>',
                '<!-- /for -->',
                '</ul>'
            ].join( '\n' ),
            data: [
                '{',
                '  persons: [',
                '    {',
                '      name:"erik", ',
                '      email:"errorrik@gmail.com"',
                '    },',
                '    {',
                '      name:"otakustay",',
                '      email:"otakustay@gmail.com"',
                '    }',
                '  ]',
                '}'
            ].join( '\n' )
        },
        'use': {
            template: [
                '<ul>',
                '<!-- for: ${persons} as ${p} -->',
                '  <!-- use: item(main=${p.name}, sub=${p.email}) -->',
                '<!-- /for -->',
                '</ul>',
                '<!-- target: item --><li>${main}[${sub}]</li>'
            ].join( '\n' ),
            data: [
                '{',
                '  persons: [',
                '    {',
                '      name:"erik", ',
                '      email:"errorrik@gmail.com"',
                '    },',
                '    {',
                '      name:"otakustay",',
                '      email:"otakustay@gmail.com"',
                '    }',
                '  ]',
                '}'
            ].join( '\n' )
        },
        'import': {
            template: [
                '<p><!-- import: hello --></p>',
                '<!-- target: hello -->Hello, I am ${name}!'
            ].join( '\n' ),
            data: '{ "name": "ETPL" }'
        },
        'filter': {
            template: [
                '<!-- filter: html -->',
                'Hello, I am <b>${name}</b>!',
                '<!-- /filter -->',
                'Hello, I am <b>${name}</b>!'
            ].join( '\n' ),
            data: '{ "name": "ETPL" }'
        },
        'master': {
            template: [
                '<!-- master: myMaster -->',
                '<header><!-- contentplaceholder: head -->header<!-- /contentplaceholder--></header>',
                '<p><!-- contentplaceholder: body -->body<!-- /contentplaceholder--></p>',
                '<footer><!-- contentplaceholder: foot --></footer>',
                '',
                '<!-- target: myTarget(master=myMaster) -->',
                '<!-- content: body -->Hello, I am ${name}!<!-- /content -->',
                '<!-- content: foot --><!-- import: copyright --><!-- /content -->',
                '',
                '<!-- target: copyright -->&copy;2013'
            ].join( '\n' ),
            data: '{ "name": "ETPL" }'
        },
        'vs': {
            template: [
                'Hello ${htmlcontent}!',
                'Hello ${htmlcontent | raw}!',
                'Search <a href="search?${urlcontent | url}">${urlcontent}</a>!'
            ].join( '\n' ),
            data: [
                '{ ',
                '  "htmlcontent": "<b>ETPL</b>",',
                '  "urlcontent": "中文"',
                '}'
            ].join( '\n' )
        },
        'var': {
            template: [
                '<!-- var: name = "errorrik" -->',
                'Hello ${name}!'
            ].join( '\n' ),
            data: '{ "name": "ETPL" }'
        },
        'dg': {
            template: [
                'Hello ${ETPL}!'
            ].join( '\n' ),
            data: [
                '{ ',
                '    get: function (name) {',
                '        return name + ":D";',
                '    }',
                '}'
            ].join( '\n' ),
        }
    };

    document.getElementById( 'try-nav' ).onclick = function ( e ) {
        e = e || window.event;
        var target = e.srcElement || e.target;

        if ( target.tagName == 'LI' ) {
            var type = target.getAttribute( 'data-nav' ) || target.innerHTML;
            var tryCode = tryCodes[ type ];
            if ( tryCode ) {
                tplText.value = tryCode.template;
                dataText.value = tryCode.data;
                tryRender();
            }
        }
    };
})();

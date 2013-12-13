(function () {
    var tplText = document.getElementById( 'text-template' );
    var dataText = document.getElementById( 'text-data' );
    var resultText = document.getElementById( 'text-result' );

    tplText.value = [
        '<ul>',
        '<!-- for: ${persons} as ${person} -->',
        '    <li>${person.name}[${person.email}]</li>',
        '<!-- /for -->',
        '</ul>'
    ].join( '\n' );

    dataText.value = [
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
    ].join( '\n' );

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
})();

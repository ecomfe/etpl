define(
    function (require) {
        var etpl = require( 'etpl' );
        var readText = require( 'readTextSync' );
        var text = readText( 'spec/variableSubstitution.text.html' );
        etpl.addFilter( 'slice', function (source, begin, end) {
            return source.slice( begin, end );
        } );
        etpl.addFilter( 'dateFormat', function (source) {
            return source.getFullYear() + '-' + (source.getMonth() + 1) + '-' + source.getDate();
        } );
        etpl.compile( text['tpl'] );

        var data = {
            name: text['name'],
            address: text['address'],
            info: {
                repos: text['info-repos'],
                contributor: {
                    name: text['info-contributor-name'],
                    email: text['info-contributor-email']
                }
            },
            first: parseInt( text.first, 10 ),
            end: parseInt( text.end, 10 ),
            date: eval( text.date )
        };

        data.contributors = [data.info.contributor];

        describe('Variable Substitution', function() {
            it(
                'should encode html by default', 
                function() {
                    expect(etpl.getRenderer('variableSubstitution-normal')(data))
                        .toEqual(text['expect-normal']);
                }
            );

            it(
                'should substitute raw string when use raw filter', 
                function() {
                    expect(etpl.getRenderer('variableSubstitution-raw')(data))
                        .toEqual(text['expect-raw']);
                }
            );

            it(
                'should substitute correctly if has more than 1 filters', 
                function() {
                    expect(etpl.getRenderer('variableSubstitution-filters')(data))
                        .toEqual(text['expect-filters']);
                }
            );

            it(
                'should use raw value when prefix "*"', 
                function() {
                    expect(etpl.getRenderer('variableSubstitution-rawvalue')(data))
                        .toEqual(text['expect-rawvalue']);
                }
            );

            it(
                'can accept data in filter', 
                function() {
                    expect(etpl.getRenderer('variableSubstitution-filter-arg')(data))
                        .toEqual(text['expect-filter-arg']);
                }
            );

            it(
                'should substitute correctly when many variables and filters mixed', 
                function() {
                    expect(etpl.getRenderer('variableSubstitution-mix')(data))
                        .toEqual(text['expect-mix']);
                }
            );

            it(
                'can use property accessor "."', 
                function() {
                    expect(etpl.getRenderer('variableSubstitution-property-accessor')(data))
                        .toEqual(text['expect-property-accessor']);
                }
            );

            it(
                'can use property accessor "[]"', 
                function() {
                    expect(etpl.getRenderer('variableSubstitution-property-accessor2')(data))
                        .toEqual(text['expect-property-accessor2']);
                }
            );
        });
    }
);
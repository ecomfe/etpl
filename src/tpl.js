/**
 * ETPL (Enterprise Template)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 加载模板的amd模块
 * @author errorrik(errorrik@gmail.com)
 */

define( 
    function ( require, exports, module ) {
        var etpl = require( '.' );

        return {
            load: function ( resourceId, require, load, config ) {
                var xhr = window.XMLHttpRequest 
                    ? new XMLHttpRequest()
                    : new ActiveXObject( 'Microsoft.XMLHTTP' );
                xhr.open( 'GET', resourceId, true );
                xhr.onreadystatechange = function () {
                    if ( xhr.readyState == 4 ) {
                        if ( xhr.status >= 200 && xhr.status < 300 ) {
                            var source = xhr.responseText;
                            var moduleConfig = module.config();
                            if ( typeof moduleConfig.autoCompile == 'undefined'
                                || moduleConfig.autoCompile 
                            ) {
                                etpl.compile( source );
                            }

                            load( source );
                        }

                        xhr.onreadystatechange = new Function();
                        xhr = null;
                    }
                };

                xhr.send( null );
            },

            normalize: function ( resourceId ) {
                var url = resourceId;

                if ( !/^([a-z]{2,10}:\/)?\//i.test( url ) ) {
                    var baseSegs = location.pathname.split( '/' );
                    var relativeSegs = url.split( '/' );

                    var levelPoint = baseSegs.length - 2;
                    for ( var i = 0, len = relativeSegs.length; i < len; i++ ) {
                        var seg = relativeSegs[ i ];
                        switch ( seg ) {
                            case '.':
                                break;
                            case '..':
                                if ( levelPoint > 0 ) {
                                    levelPoint--;
                                }
                                break;
                            default:
                                baseSegs[ ++levelPoint ] = seg;
                                break;
                        }
                    }

                    baseSegs.length = levelPoint + 1;
                    url = baseSegs.join( '/' );
                }

                return url;
            }
        };
    }
);
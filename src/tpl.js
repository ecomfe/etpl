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
            load: function ( resourceId, req, load, config ) {
                var xhr = window.XMLHttpRequest 
                    ? new XMLHttpRequest()
                    : new ActiveXObject( 'Microsoft.XMLHTTP' );
                xhr.open( 'GET', req.toUrl( resourceId ), true );
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
            }
        };
    }
);
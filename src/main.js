/**
 * ETPL (Enterprise Template)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 模板引擎
 * @author errorrik(errorrik@gmail.com)
 *         otakustay(otakustay@gmail.com)
 */

// 有的正则比较长，所以特别放开一些限制
/* jshint maxdepth: 10, unused: false, white: false */

define(
    function ( require, exports, module ) {
        /**
         * 对象属性拷贝
         * 
         * @inner
         * @param {Object} target 目标对象
         * @param {Object} source 源对象
         * @return {Object} 返回目标对象
         */
        function extend( target, source ) {
            for ( var key in source ) {
                if ( source.hasOwnProperty( key ) ) {
                    target[ key ] = source[ key ];
                }
            }

            return target;
        }

        /**
         * 随手写了个数组作为string buffer和stack
         *
         * @inner
         * @constructor
         */
        function ArrayBuffer() {
            this.raw = [];
            this.length = 0;
        }

        ArrayBuffer.prototype = {
            /**
             * 添加元素到数组末端
             *
             * @param {...*} elem 添加项
             */
            push: function () {
                for ( var i = 0, len = arguments.length; i < len; i++ ) {
                    this.raw[ this.length++ ] = arguments[ i ];
                }
            },

            /**
             * 弹出顶部元素
             *
             * @return {*}
             */
            pop: function () {
                if ( this.length < 0 ) {
                    return null;
                }

                var elem = this.raw[ --this.length ];
                this.raw.length = this.length;

                return elem;
            },

            /**
             * 获取顶部元素
             *
             * @return {*}
             */
            top: function () {
                return this.raw[ this.length - 1 ];
            },

            /**
             * 获取底部元素
             *
             * @return {*}
             */
            bottom: function () {
                return this.raw[ 0 ];
            },

            /**
             * 连接数组项
             *
             * @param {string} split 分隔串
             * @return {string}
             */
            join: function ( split ) {
                return this.raw.join( split );
            },

            /**
             * 根据查询条件获取元素，逆序查找
             * 
             * @param {Function} condition 查询函数
             * @return {*}
             */
            findReversed: function ( condition ) {
                var index = this.length;
                while ( index-- ) {
                    var item = this.raw[ index ];
                    if ( condition( item ) ) {
                        return item;
                    }
                }

                return null;
            }
        };

        /**
         * 唯一id的起始值
         * 
         * @inner
         * @type {number}
         */
        var guidIndex = 0xCADB7;

        /**
         * 获取唯一id，用于匿名target或编译代码的变量名生成
         * 
         * @inner
         * @return {string}
         */
        function generateGUID() {
            return '____' + (guidIndex++);
        }

        /**
         * 节点状态
         * 
         * @inner
         */
        var NodeState = {
            READING: 1,
            READED: 2,
            READY: 3
        };

        /**
         * 构建类之间的继承关系
         * 
         * @inner
         * @param {Function} subClass 子类函数
         * @param {Function} superClass 父类函数
         */
        function inherits( subClass, superClass ) {
            var F = new Function();
            F.prototype = superClass.prototype;
            var subClassPrototype = subClass.prototype;

            subClass.prototype = new F();
            subClass.prototype.constructor = subClass;
            extend( subClass.prototype, subClassPrototype );
        }

        var HTML_ENTITY = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };

        function htmlFilterReplacer( c ) {
            return HTML_ENTITY[ c ];
        }

        /**
         * 默认filter
         * 
         * @inner
         * @const
         * @type {Object}
         */
        var DEFAULT_FILTERS = {
            html: function ( source ) {
                return source.replace( /[&<>"']/g, htmlFilterReplacer );
            },
            url: encodeURIComponent,
            raw: function ( source ) {
                return source;
            }
        };

        /**
         * 自动创建target，用于匿名target的创建
         * 
         * @inner
         * @param {Object} context 语法分析环境对象
         */
        function autoCreateTarget( context ) {
            if ( context.position.bottom() ) {
                return;
            }

            var target = new TargetCommand( generateGUID(), context.engine );
            target.open( context );
        }

        /**
         * 字符串字面化
         * 
         * @inner
         * @param {string} source 需要字面化的字符串
         * @return {string}
         */
        function stringLiteralize( source ) {
            return '"'
                + source
                    .replace( /\x5C/g, '\\\\' )
                    .replace( /"/g, '\\"' )
                    .replace( /\x0A/g, '\\n' )
                    .replace( /\x09/g, '\\t' )
                    .replace( /\x0D/g, '\\r' )
                    .replace( /\x08/g, '\\b' )
                    .replace( /\x0C/g, '\\f' )
                + '"';
        }

        /**
         * 字符串格式化
         * 
         * @inner
         * @param {string} source 目标模版字符串
         * @param {...string} replacements 字符串替换项集合
         * @return {string}
         */
        function stringFormat( source ) {
            var args = arguments;
            return source.replace( 
                /\{([0-9]+)\}/g,
                function ( match, index ) {
                    return args[ index - 0 + 1 ];
                } );
        }

        var RENDER_STRING_DECLATION = 'var str="";';
        var RENDER_STRING_ADD_START = 'str+=';
        var RENDER_STRING_ADD_END = ';';
        var RENDER_STRING_RETURN = 'return str;';

        if ( typeof navigator !== 'undefined' 
            && /msie/i.test( navigator.userAgent ) 
        ) {
            RENDER_STRING_DECLATION = 'var str=new StringBuffer();';
            RENDER_STRING_ADD_START = 'str.push(';
            RENDER_STRING_ADD_END = ');';
            RENDER_STRING_RETURN = 'return str.join("");';
        }

        /**
         * getVariable调用的renderer body模板串
         * 
         * @inner
         * @const
         * @type {string}
         */
        var GET_VARIABLE_TPL = 'gv("{0}",["{1}"])';

        /**
         * getVariableStr调用的renderer body模板串
         * 
         * @inner
         * @const
         * @type {string}
         */
        var GET_VARIABLE_STR_TPL = 'gvs("{0}",["{1}"])';

        /**
         * 将访问变量名称转换成getVariable调用的编译语句
         * 用于if、var等命令生成编译代码
         * 
         * @inner
         * @param {string} name 访问变量名
         * @param {boolean} isStr 是否字符串形式的访问
         * @return {string}
         */
        function toGetVariableLiteral( name, isStr ) {
            return stringFormat(
                (isStr ? GET_VARIABLE_STR_TPL : GET_VARIABLE_TPL),
                name,
                name.split( '.' ).join( '","' )
            );
        }

        /**
         * 替换字符串中的${...}成getVariable调用的编译语句
         * 用于if、var等命令生成编译代码
         *
         * @inner
         * @param {string} source 源字符串
         * @return {string}
         */
        function replaceGetVariableLiteral( source ) {
            return source.replace(
                /\$\{([0-9a-z_\.]+)\}/ig,
                function( match, name ){
                    return toGetVariableLiteral( name );
                }
            );
        }

        /**
         * 文本节点类
         * 
         * @inner
         * @constructor
         * @param {string} value 文本节点的内容文本
         * @param {Engine} engine 引擎实例
         */
        function TextNode( value, engine ) {
            this.value = value;
            this.engine = engine;
        }
        
        TextNode.prototype = {
            /**
             * 结点添加到语法分析环境前的处理动作
             * 
             * @param {Object} context 语法分析环境对象
             */
            beforeAdd: autoCreateTarget,

            /**
             * 获取renderer body的生成代码
             * 
             * @return {string}
             */
            getRendererBody: function () {
                var defaultFilter = this.engine.options.defaultFilter;
                var code = new ArrayBuffer();
                var texts = this.value.split( '${' );
                for ( var i = 0, len = texts.length; i < len; i++ ) {
                    var text = texts[ i ];
                    if ( i !== 0 ) {
                        var rightIndex = text.indexOf( '}' );
                        if ( rightIndex > 0 ) {
                            var variableText = text.slice( 0, rightIndex );
                            text = text.slice( rightIndex + 1 );
                            generateVariableSubstitutionCode( variableText );
                        }
                        else {
                            text = '${' + text;
                        }
                    }

                    code.push( 
                        RENDER_STRING_ADD_START, 
                        stringLiteralize( text ), 
                        RENDER_STRING_ADD_END
                    );
                }

                
                function generateVariableSubstitutionCode( source ) {
                    if ( source.indexOf( '|' ) < 0 && defaultFilter ) {
                        source += '|' + defaultFilter;
                    }
                    code.push( RENDER_STRING_ADD_START );

                    var segs = source.split( /\s*\|\s*/ );
                    var codeTail = new ArrayBuffer();
                    var codeHead = [];
                    var variableName = segs[ 0 ];

                    for ( var i = 1, len = segs.length; i < len; i++ ) {
                        var seg = segs[ i ];

                        if ( /^\s*([a-z0-9_-]+)(\((.*)\))?\s*$/i.test( seg ) ) {
                            codeHead.unshift( 'fs["' + RegExp.$1 + '"](' );

                            if ( RegExp.$3 ) {
                                codeTail.push( ',', replaceGetVariableLiteral( RegExp.$3 ) );
                            }
                            codeTail.push( ')' );
                        }
                    }

                    code.push( 
                        codeHead.join( '' ),
                        toGetVariableLiteral( variableName, 1 ),
                        codeTail.join( '' ),
                        RENDER_STRING_ADD_END
                    );
                }

                return code.join('');
            },

            /**
             * 获取内容
             * 
             * @return {string}
             */
            getContent: function () {
                return this.value;
            }
        };

        /**
         * 命令节点类
         * 
         * @inner
         * @constructor
         * @param {string} value 命令节点的value
         * @param {Engine} engine 引擎实例
         */
        function Command( value, engine ) {
            this.value = value;
            this.engine = engine;
            this.children = [];
            this.realChildren = this.children;
        }

        Command.prototype = {
            /**
             * 添加子节点
             * 
             * @param {TextNode|Command} node 子节点
             */
            addChild: function ( node ) {
                this.children.push( node );
            },

            /**
             * 节点open，解析开始
             * 
             * @param {Object} context 语法分析环境对象
             */
            open: function ( context ) {
                var parent = context.position.top();
                this.parent = parent;
                parent && parent.addChild( this );
                context.position.push( this );
            },

            /**
             * 节点闭合，解析结束
             * 
             * @param {Object} context 语法分析环境对象
             */
            close: function ( context ) {
                while (context.position.pop().constructor !== this.constructor)
                    ;;
            },

            /**
             * 添加文本节点
             * 
             * @param {TextNode} node 节点
             */
            addTextNode: function ( node ) {
                this.addChild( node );
            },

            /**
             * 获取renderer body的生成代码
             * 
             * @return {string}
             */
            getRendererBody: function () {
                var buf = new ArrayBuffer();
                var children = this.realChildren;
                for ( var i = 0; i < children.length; i++ ) {
                    buf.push( children[ i ].getRendererBody() );
                }

                return buf.join( '' );
            }
        };

        /**
         * 读取name形式的命令值
         * 
         * @inner
         * @param {Command} node 命令节点
         * @param {string} value 命令值
         */
        function readNameOfCommandValue( node, value ) {
            if ( /^\s*([a-z0-9_-]+)\s*$/i.test( value ) ) {
                node.name = RegExp.$1;
            }
        }

        /**
         * 读取name和master形式的命令值
         * 
         * @inner
         * @param {Command} node 命令节点
         * @param {string} value 命令值
         */
        function readNameAndMasterOfCommandValue( node, value ) {
            if ( /^\s*([a-z0-9_-]+)\s*(\(\s*master\s*=\s*([a-z0-9_-]+)\s*\))?\s*/i.test( value ) ) {
                node.name = RegExp.$1;
                if ( RegExp.$2 ) {
                    node.master = RegExp.$3;
                }
            }
        }

        /**
         * 命令自动闭合
         * 
         * @param {Object} context 语法分析环境对象
         * @param {Function=} CommandType 自闭合的节点类型
         */
        function autoCloseCommand( context, CommandType ) {
            var position = context.position;
            var closeEnd = CommandType 
                ? position.findReversed( function ( item ) {
                    return item instanceof CommandType;
                } ) 
                : position.bottom();

            if ( !closeEnd ) {
                return;
            }

            var node;
            do {
                node = position.top();

                // 如果节点对象不包含autoClose方法
                // 则认为该节点不支持自动闭合，需要抛出错误
                // for、if等节点不支持自动闭合
                if ( !node.autoClose ) {
                    throw new Error( node.type + ' must be closed manually!' );
                }
                node.autoClose( context );
            } while ( node !== closeEnd );
        }

        /**
         * renderer body起始代码段
         * 
         * @inner
         * @const
         * @type {string}
         */
        var RENDERER_BODY_START = ''
            + 'data=data||{};'
            + 'var v={},fs=engine.filters,'
            + 'gv=typeof data.get==="function"'
            +     '? function(n){return data.get(n);}'
            +     ': function(n,ps){'
            +         'var p=ps[0],d=v[p];'
            +         'd=d==null?data[p]:d;'
            +         'for(var i=1,l=ps.length;i<l;i++)if(d!=null)d = d[ps[i]];'
            +         'return d;'
            +     '},'
            + 'gvs=function(n,ps){'
            +     'var v=gv(n,ps);'
            +     'if(typeof v==="string"){return v;}'
            +     'if(v==null){v="";}'
            +     'return ""+v;'
            + '};'
        ;
        
        /**
         * Target命令节点类
         * 
         * @inner
         * @constructor
         * @param {string} value 命令节点的value
         * @param {Engine} engine 引擎实例
         */
        function TargetCommand( value, engine ) {
            readNameAndMasterOfCommandValue( this, value );
            var name = this.name;
            if ( engine.targets[ name ] ) {
                throw new Error( 'Target "' + name + '" is exists!' );
            }

            Command.call( this, value, engine );
            this.contents = {};
        }

        // 创建Target命令节点继承关系
        inherits( TargetCommand, Command );

        /**
         * Master命令节点类
         * 
         * @inner
         * @constructor
         * @param {string} value 命令节点的value
         * @param {Engine} engine 引擎实例
         */
        function MasterCommand( value, engine ) {
            readNameAndMasterOfCommandValue( this, value );
            var name = this.name;
            if ( engine.masters[ name ] ) {
                throw new Error( 'Master "' + name + '" is exists!' );
            }

            Command.call( this, value, engine );
            this.contents = {};
        }

        // 创建Master命令节点继承关系
        inherits( MasterCommand, Command );

        /**
         * Content命令节点类
         * 
         * @inner
         * @constructor
         * @param {string} value 命令节点的value
         * @param {Engine} engine 引擎实例
         */
        function ContentCommand( value, engine ) {
            Command.call( this, value, engine );
            readNameOfCommandValue( this, value );
        }

        // 创建Content命令节点继承关系
        inherits( ContentCommand, Command );

        /**
         * ContentPlaceHolder命令节点类
         * 
         * @inner
         * @constructor
         * @param {string} value 命令节点的value
         * @param {Engine} engine 引擎实例
         */
        function ContentPlaceHolderCommand( value, engine ) {
            Command.call( this, value, engine );
            readNameOfCommandValue( this, value );
        }

        // 创建ContentPlaceHolder命令节点继承关系
        inherits( ContentPlaceHolderCommand, Command );
        
        /**
         * Import命令节点类
         * 
         * @inner
         * @constructor
         * @param {string} value 命令节点的value
         * @param {Engine} engine 引擎实例
         */
        function ImportCommand( value, engine ) {
            Command.call( this, value, engine );
            readNameOfCommandValue( this, value );
        }

        // 创建Import命令节点继承关系
        inherits( ImportCommand, Command );

        /**
         * Var命令节点类
         * 
         * @inner
         * @constructor
         * @param {string} value 命令节点的value
         * @param {Engine} engine 引擎实例
         */
        function VarCommand( value, engine ) {
            if ( !/^\s*([a-z0-9_]+)\s*=(.*)$/i.test( value ) ) {
                throw new Error( 'Invalid ' + this.type + ' syntax: ' + value );
            }

            this.varName = RegExp.$1;
            this.varValue = RegExp.$2;
            Command.call( this, value, engine );
        }

        // 创建Var命令节点继承关系
        inherits( VarCommand, Command );

        /**
         * filter命令节点类
         * 
         * @inner
         * @constructor
         * @param {string} value 命令节点的value
         * @param {Engine} engine 引擎实例
         */
        function FilterCommand( value, engine ) {
            if ( !/^\s*([a-z0-9_-]+)\s*(\((.*)\))?\s*$/i.test( value ) ) {
                throw new Error( 'Invalid ' + this.type + ' syntax: ' + value );
            }

            this.name = RegExp.$1;
            this.paramValue = RegExp.$3 || '';
            Command.call( this, value, engine );
        }

        // 创建filter命令节点继承关系
        inherits( FilterCommand, Command );

        /**
         * Use命令节点类
         * 
         * @inner
         * @constructor
         * @param {string} value 命令节点的value
         * @param {Engine} engine 引擎实例
         */
        function UseCommand( value, engine ) {
            if ( !/^\s*([a-z0-9_-]+)\s*(\((.*)\))?\s*$/i.test( value ) ) {
                throw new Error( 'Invalid ' + this.type + ' syntax: ' + value );
            }

            this.name = RegExp.$1;
            this.paramValue = RegExp.$3 || '';
            Command.call( this, value, engine );
        }

        // 创建Use命令节点继承关系
        inherits( UseCommand, Command );

        /**
         * for命令节点类
         * 
         * @inner
         * @constructor
         * @param {string} value 命令节点的value
         * @param {Engine} engine 引擎实例
         */
        function ForCommand( value, engine ) {
            if ( !/^\s*\$\{([0-9a-z_\.]+)\}\s+as\s+\$\{([0-9a-z_]+)\}\s*(,\s*\$\{([0-9a-z_]+)\})?\s*$/i.test( value ) ) {
                throw new Error( 'Invalid ' + this.type + ' syntax: ' + value );
            }
            
            this.list = RegExp.$1;
            this.item = RegExp.$2;
            this.index = RegExp.$4;
            Command.call( this, value, engine );
        }

        // 创建for命令节点继承关系
        inherits( ForCommand, Command );
        
        /**
         * if命令节点类
         * 
         * @inner
         * @constructor
         * @param {string} value 命令节点的value
         * @param {Engine} engine 引擎实例
         */
        function IfCommand( value, engine ) {
            Command.call( this, value, engine );
            if ( !/^\s*([>=<!0-9a-z$\{\}\[\]\(\):\s'"\.\|&_]+)\s*$/i.test( value ) ) {
                throw new Error( 'Invalid ' + this.type + ' syntax: ' + value );
            }

            Command.call( this, value, engine );
        }

        // 创建if命令节点继承关系
        inherits( IfCommand, Command );

        /**
         * elif命令节点类
         * 
         * @inner
         * @constructor
         * @param {string} value 命令节点的value
         * @param {Engine} engine 引擎实例
         */
        function ElifCommand( value, engine ) {
            IfCommand.call( this, value, engine );
        }

        // 创建elif命令节点继承关系
        inherits( ElifCommand, IfCommand );

        /**
         * else命令节点类
         * 
         * @inner
         * @constructor
         * @param {string} value 命令节点的value
         * @param {Engine} engine 引擎实例
         */
        function ElseCommand( value, engine ) {
            Command.call( this, value, engine );
        }

        // 创建else命令节点继承关系
        inherits( ElseCommand, Command ); 
        
        /**
         * 节点闭合，解析结束
         * 
         * @param {Object} context 语法分析环境对象
         */
        MasterCommand.prototype.close =

        /**
         * 节点闭合，解析结束。自闭合时被调用
         * 
         * @param {Object} context 语法分析环境对象
         */
        MasterCommand.prototype.autoClose = 

        /**
         * 节点闭合，解析结束
         * 
         * @param {Object} context 语法分析环境对象
         */
        TargetCommand.prototype.close =

        /**
         * 节点闭合，解析结束。自闭合时被调用
         * 
         * @param {Object} context 语法分析环境对象
         */
        TargetCommand.prototype.autoClose = function ( context ) {
            Command.prototype.close.call( this, context );
            this.state = NodeState.READED;
            context.targetOrMaster = null;
        };

        /**
         * 应用其继承的母版
         */
        TargetCommand.prototype.applyMaster = 

        /**
         * 应用其继承的母版
         */
        MasterCommand.prototype.applyMaster = function () {
            if ( this.state >= NodeState.READY ) {
                return;
            }

            var masterName = this.master;
            if ( masterName ) {
                var masterNode = this.engine.masters[ masterName ];
                if ( !masterNode ) {
                    return;
                }
                masterNode.applyMaster();

                if ( masterNode.state < NodeState.READY ) {
                    return;
                }
                
                var masterChildren = masterNode.realChildren;
                this.realChildren = [];

                for ( var i = 0, len = masterChildren.length; i < len; i++ ) {
                    var child = masterChildren[ i ];

                    if ( child instanceof ContentPlaceHolderCommand ) {
                        var contentNode = this.contents[ child.name ];
                        
                        this.realChildren.push.apply( 
                            this.realChildren, 
                            (contentNode || child).realChildren
                        );
                    }
                    else {
                        this.realChildren.push( child );
                    }
                }
            }

            this.state = NodeState.READY;
        };

        /**
         * 获取target的renderer函数
         * 
         * @return {function(Object):string}
         */
        TargetCommand.prototype.getRenderer = function () {
            if ( this.renderer ) {
                return this.renderer;
            }

            var engine = this.engine;
            var StringBuffer = ArrayBuffer;
            this.applyMaster();
            
            if ( this.state === NodeState.READY && this.isImportsReady() ) {
                console.log(RENDERER_BODY_START +RENDER_STRING_DECLATION
                    + this.getRendererBody() 
                    + RENDER_STRING_RETURN)

                var realRenderer = new Function( 
                    'data', 'engine', 'StringBuffer',
                    [
                        RENDERER_BODY_START,
                        RENDER_STRING_DECLATION,
                        this.getRendererBody(),
                        RENDER_STRING_RETURN
                    ].join( '\n' )
                );

                this.renderer = function ( data ) {
                    return realRenderer( data, engine, StringBuffer );
                };

                return this.renderer;
            }

            return null;
        };

        /**
         * 获取内容
         * 
         * @return {string}
         */
        TargetCommand.prototype.getContent = function () {
            this.applyMaster();
            if ( this.state === NodeState.READY && this.isImportsReady() ) {
                var buf = new ArrayBuffer();
                var children = this.realChildren;
                for ( var i = 0; i < children.length; i++ ) {
                    buf.push( children[ i ].getContent() );
                }

                return buf.join( '' );
            }

            return '';
        };

        /**
         * 判断target的imports是否准备完成
         * 
         * @return {boolean}
         */
        TargetCommand.prototype.isImportsReady = function () {
            this.applyMaster();
            if ( this.state < NodeState.READY ) {
                return false;
            }

            var readyState = true;
            var engine = this.engine;

            /**
             * 递归检查节点的ready状态
             * 
             * @inner
             * @param {Command|TextNode} node 目标节点
             */
            function checkReadyState( node ) {
                var children = node.realChildren;

                for ( var i = 0, len = children.length; i < len; i++ ) {
                    var child = children[ i ];
                    if ( child instanceof ImportCommand 
                        || child instanceof UseCommand
                    ) {
                        var target = engine.targets[ child.name ];
                        readyState = readyState 
                            && target && target.isImportsReady( engine );
                    }
                    else if ( child instanceof Command ) {
                        checkReadyState( child );
                    }
                }
            }

            checkReadyState( this );
            return readyState;
        };

        /**
         * target节点open，解析开始
         * 
         * @param {Object} context 语法分析环境对象
         */
        TargetCommand.prototype.open = function ( context ) {
            autoCloseCommand( context );
            Command.prototype.open.call( this, context );

            var name = this.name;
            context.targetOrMaster = this;
            this.state = NodeState.READING;
            context.engine.targets[ name ] = this;
            context.targets.push( name );
        };

        /**
         * master节点open，解析开始
         * 
         * @param {Object} context 语法分析环境对象
         */
        MasterCommand.prototype.open = function ( context ) {
            autoCloseCommand( context );
            Command.prototype.open.call( this, context );

            var name = this.name;
            context.targetOrMaster = this;
            this.state = NodeState.READING;
            context.engine.masters[ name ] = this;
        };

        /**
         * Import节点open，解析开始
         * 
         * @param {Object} context 语法分析环境对象
         */
        ImportCommand.prototype.open = 

        /**
         * Var节点open，解析开始
         * 
         * @param {Object} context 语法分析环境对象
         */
        VarCommand.prototype.open = 

        /**
         * Use节点open，解析开始
         * 
         * @param {Object} context 语法分析环境对象
         */
        UseCommand.prototype.open = function ( context ) {
            var parent = context.position.top();
            this.parent = parent;
            parent.addChild( this );
        };


        /**
         * 节点open前的处理动作：节点不在target中时，自动创建匿名target
         * 
         * @param {Object} context 语法分析环境对象
         */
        UseCommand.prototype.beforeOpen = 
        ImportCommand.prototype.beforeOpen = 
        VarCommand.prototype.beforeOpen = 
        ForCommand.prototype.beforeOpen = 
        FilterCommand.prototype.beforeOpen = 
        IfCommand.prototype.beforeOpen = autoCreateTarget;

        /**
         * 节点解析结束
         * 由于use节点无需闭合，处理时不会入栈，所以将close置为空函数
         * 
         * @param {Object} context 语法分析环境对象
         */
        UseCommand.prototype.close = 

        /**
         * 节点解析结束
         * 由于import节点无需闭合，处理时不会入栈，所以将close置为空函数
         * 
         * @param {Object} context 语法分析环境对象
         */ 
        ImportCommand.prototype.close = 

        /**
         * 节点解析结束
         * 由于else节点无需闭合，处理时不会入栈，闭合由if负责。所以将close置为空函数
         * 
         * @param {Object} context 语法分析环境对象
         */
        ElseCommand.prototype.close = 

        /**
         * 节点解析结束
         * 由于var节点无需闭合，处理时不会入栈，所以将close置为空函数
         * 
         * @param {Object} context 语法分析环境对象
         */
        VarCommand.prototype.close = function () {};
        
        /**
         * 获取renderer body的生成代码
         * 
         * @return {string}
         */
        UseCommand.prototype.getRendererBody = function () {
            return stringFormat(
                '{0}engine.render({2},{{3}}){1}',
                RENDER_STRING_ADD_START,
                RENDER_STRING_ADD_END,
                stringLiteralize( this.name ),
                replaceGetVariableLiteral( 
                    this.paramValue.replace( 
                        /(^|,)\s*([a-z0-9_]+)\s*=/ig,
                        function ( match, start, paramName ) {
                            return (start || '') + stringLiteralize( paramName ) + ':'
                        }
                    )
                )
            );
        };
        
        /**
         * 获取renderer body的生成代码
         * 
         * @return {string}
         */
        VarCommand.prototype.getRendererBody = function () {
            if ( this.varValue ) {
                return stringFormat( 
                    'v[{0}]={1};',
                    stringLiteralize( this.varName ),
                    replaceGetVariableLiteral( this.varValue )
                );
            }

            return '';
        };

        /**
         * 获取renderer body的生成代码
         * 
         * @return {string}
         */
        ImportCommand.prototype.getRendererBody = function () {
            var target = this.engine.targets[ this.name ];
            return target.getRendererBody();
        };

        /**
         * 获取renderer body的生成代码
         * 
         * @return {string}
         */
        FilterCommand.prototype.getRendererBody = function () {
            var filterParams = this.paramValue;
            return stringFormat(
                '{2}fs[{5}]((function(){{0}{4}{1}})(){6}){3}',
                RENDER_STRING_DECLATION,
                RENDER_STRING_RETURN,
                RENDER_STRING_ADD_START,
                RENDER_STRING_ADD_END,
                Command.prototype.getRendererBody.call( this ),
                stringLiteralize( this.name ),
                filterParams 
                    ? ',' + replaceGetVariableLiteral( filterParams )
                    : ''
            );
        };

        /**
         * 获取renderer body的生成代码
         * 
         * @return {string}
         */
        IfCommand.prototype.getRendererBody = function () {
            var rendererBody = stringFormat(
                'if({0}){{1}}',
                replaceGetVariableLiteral( this.value ),
                Command.prototype.getRendererBody.call( this )
            );

            var elseCommand = this[ 'else' ];
            if ( elseCommand ) {
                return [
                    rendererBody,
                    stringFormat( 
                        'else{{0}}',
                        elseCommand.getRendererBody()
                    )
                ].join( '' );
            }

            return rendererBody;
        };

        /**
         * 获取renderer body的生成代码
         * 
         * @return {string}
         */
        ForCommand.prototype.getRendererBody = function () {
            return stringFormat(
                ''
                + 'var {0}={1};'
                + 'if({0} instanceof Array)'
                +     'for (var {4}=0,{5}={0}.length;{4}<{5};{4}++){v[{2}]={4};v[{3}]={0}[{4}];{6}}'
                + 'else if(typeof {0}==="object")'
                +     'for(var {4} in {0}){v[{2}]={4};v[{3}]={0}[{4}];{6}}',
                generateGUID(),
                toGetVariableLiteral( this.list ),
                stringLiteralize( this.index || generateGUID() ),
                stringLiteralize( this.item ),
                generateGUID(),
                generateGUID(),
                Command.prototype.getRendererBody.call( this )
            );
        };

        /**
         * 获取内容
         * 
         * @return {string}
         */
        ImportCommand.prototype.getContent = function () {
            var target = this.engine.targets[ this.name ];
            return target.getContent();
        };



        /**
         * content节点open，解析开始
         * 
         * @param {Object} context 语法分析环境对象
         */
        ContentCommand.prototype.open = function ( context ) {
            autoCloseCommand( context, ContentCommand );
            Command.prototype.open.call( this, context );
            context.targetOrMaster.contents[ this.name ] = this;
        };
        
        /**
         * content节点open，解析开始
         * 
         * @param {Object} context 语法分析环境对象
         */
        ContentPlaceHolderCommand.prototype.open = function ( context ) {
            autoCloseCommand( context, ContentPlaceHolderCommand );
            Command.prototype.open.call( this, context );
        };

        /**
         * 节点自动闭合，解析结束
         * 
         * @param {Object} context 语法分析环境对象
         */
        ContentCommand.prototype.autoClose = Command.prototype.close;

        /**
         * 节点自动闭合，解析结束
         * contentplaceholder的自动结束逻辑为，在其开始位置后马上结束
         * 所以，其自动结束时children应赋予其所属的parent，也就是master
         * 
         * @param {Object} context 语法分析环境对象
         */
        ContentPlaceHolderCommand.prototype.autoClose = function ( context ) {
            var parentChildren = this.parent.children;
            parentChildren.push.apply( parentChildren, this.children );
            this.children.length = 0;
            this.close( context );
        };
        
        /**
         * 添加子节点
         * 
         * @param {TextNode|Command} node 子节点
         */
        IfCommand.prototype.addChild = function ( node ) {
            var elseCommand = this[ 'else' ];
            ( elseCommand 
                ? elseCommand.children 
                : this.children
            ).push( node );
        };

        /**
         * elif节点open，解析开始
         * 
         * @param {Object} context 语法分析环境对象
         */
        ElifCommand.prototype.open = function ( context ) {
            var ifCommand = context.position.top();
            if ( !( ifCommand instanceof IfCommand ) ) {
                throw new Error( ifCommand.type + ' have not been closed!' );
            }

            var elseCommand = new ElseCommand( null, this.engine );
            elseCommand.open( context );
            ifCommand.addChild( this );
            context.position.pop();
            context.position.push( this );
        };

        /**
         * else节点open，解析开始
         * 
         * @param {Object} context 语法分析环境对象
         */
        ElseCommand.prototype.open = function ( context ) {
            var ifCommand = context.position.top();
            if ( !( ifCommand instanceof IfCommand ) ) {
                throw new Error( ifCommand.type + ' have not been closed!' );
            }
            
            ifCommand[ 'else' ] = this;
        };
        
        
        
        /**
         * 命令类型集合
         * 
         * @type {Object}
         */
        var commandTypes = {};

        /**
         * 添加命令类型
         * 
         * @inner
         * @param {string} name 命令名称
         * @param {Function} Type 处理命令用到的类
         */
        function addCommandType( name, Type ) {
            if ( !commandTypes[ name ] ) {
                commandTypes[ name ] = Type;
                Type.prototype.type = name;
            }
        }

        addCommandType( 'target', TargetCommand );
        addCommandType( 'master', MasterCommand );
        addCommandType( 'content', ContentCommand );
        addCommandType( 'contentplaceholder', ContentPlaceHolderCommand );
        addCommandType( 'import', ImportCommand );
        addCommandType( 'use', UseCommand );
        addCommandType( 'var', VarCommand );
        addCommandType( 'for', ForCommand );
        addCommandType( 'if', IfCommand );
        addCommandType( 'elif', ElifCommand );
        addCommandType( 'else', ElseCommand );
        addCommandType( 'filter', FilterCommand );
        
        
        /**
         * etpl引擎类
         * 
         * @constructor
         * @param {Object=} options 引擎参数
         * @param {string=} options.commandOpen 命令语法起始串
         * @param {string=} options.commandClose 命令语法结束串
         */
        function Engine( options ) {
            this.options = {
                commandOpen: '<!--',
                commandClose: '-->',
                defaultFilter: 'html'
            };

            this.config( options );
            this.masters = {};
            this.targets = {};
            this.filters = extend({}, DEFAULT_FILTERS);
        }

        /**
         * 配置引擎参数，设置的参数将被合并到现有参数中
         * 
         * @param {Object} options 参数对象
         * @param {string=} options.commandOpen 命令语法起始串
         * @param {string=} options.commandClose 命令语法结束串
         */
        Engine.prototype.config =  function ( options ) {
            extend( this.options, options );
        };

        /**
         * 解析模板并编译，返回第一个target编译后的renderer函数。
         * 
         * @param {string} source 模板源代码
         * @return {function(Object):string}
         */
        Engine.prototype.compile = 

        /**
         * 解析模板并编译，返回第一个target编译后的renderer函数。
         * 该方法的存在为了兼容老模板引擎
         * 
         * @param {string} source 模板源代码
         * @return {function(Object):string}
         */
        Engine.prototype.parse = function ( source ) {
            var targetNames = parseSource( source, this );
            if ( targetNames.length ) {
                var firstTarget = this.targets[ targetNames[ 0 ] ];
                return firstTarget.getRenderer();
            }
        };
        
        /**
         * 根据target名称获取编译后的renderer函数
         * 
         * @param {string} name target名称
         * @return {function(Object):string}
         */
        Engine.prototype.getRenderer = function ( name ) {
            var target = this.targets[ name ];
            if ( target ) {
                return target.getRenderer();
            }
        };

        /**
         * 根据target名称获取模板内容
         * 
         * @param {string} name target名称
         * @return {string}
         */
        Engine.prototype.get = function ( name ) {
            var target = this.targets[ name ];
            if ( target ) {
                return target.getContent();
            }

            return '';
        };

        /**
         * 执行模板渲染，返回渲染后的字符串。
         * 
         * @param {string} name target名称
         * @param {Object=} data 模板数据。
         *      可以是plain object，
         *      也可以是带有 {string}get({string}name) 方法的对象
         * @return {string}
         */
        Engine.prototype.render= function ( name, data ) {
            var renderer = this.getRenderer( name );
            if ( renderer ) {
                return renderer( data );
            }

            return '';
        };

        /**
         * 增加过滤器
         * 
         * @param {string} name 过滤器名称
         * @param {Function} filter 过滤函数
         */
        Engine.prototype.addFilter= function ( name, filter ) {
            if ( typeof filter === 'function' ) {
                this.filters[ name ] = filter;
            }
        };

        /**
         * 解析源代码
         * 
         * @inner
         * @param {string} source 模板源代码
         * @param {Engine} engine 引擎实例
         * @return {Array} target名称列表
         */
        function parseSource( source, engine ) {
            var commandOpen = engine.options.commandOpen;
            var commandClose = engine.options.commandClose;
            var commandCloseLen = commandClose.length;

            var position = new ArrayBuffer();
            var analyseContext = {
                engine: engine,
                targets: [],
                position: position
            };

            // text节点内容缓冲区，用于合并多text
            var textBuf = new ArrayBuffer();

            /**
             * 将缓冲区中的text节点内容写入
             *
             * @inner
             */
            function flushTextBuf() {
                var len = textBuf.length;
                var text;

                if ( len > 0 && (text = textBuf.join( '' )) !== '' ) {
                    var textNode = new TextNode( text, engine );
                    textNode.beforeAdd( analyseContext );
                    position.top().addTextNode( textNode );
                    textBuf = new ArrayBuffer();
                }
            }

            /**
             * 将 commandOpen起始，commandClose结尾 的文本串 
             * 作为不具有特殊含义的普通文本，写入流
             *
             * @inner
             */
            function beNormalText( text ) {
                if ( !/^\s*\/\//.test( text ) ) {
                    textBuf.push( commandOpen, text, commandClose );
                }
            }

            // 先以 commandOpen(默认<!--) 进行split
            var texts = source.split( commandOpen );

            var NodeType;

            /**
             * 判断节点是否是NodeType类型的实例
             * 用于在position中fine提供filter
             * 
             * @inner
             * @param {Command} node 目标节点
             * @return {boolean}
             */
            function isInstanceofNodeType( node ) {
                return node instanceof NodeType;
            }

            for ( var i = 0, len = texts.length; i < len; i++ ) {
                // 对 commandOpen(默认<!--) 进行split的结果
                // 挨个查找第一个 commandClose的位置
                // 之前为注释内容，之后为正常html内容
                var text = texts[ i ];

                if ( i === 0 ) {
                    textBuf.push( text );
                    continue;
                }

                var closeIndex = text.indexOf( commandClose );
                if ( closeIndex >= 0 ) {
                    var commentText = text.slice( 0, closeIndex );
                    if ( /^\s*(\/)?([a-z]+)\s*(:(.*))?$/.test( commentText ) ) {
                        var commandName = RegExp.$2;
                        var commandIsClose = RegExp.$1;
                        var commandValue = RegExp.$4;

                        NodeType = commandTypes[ commandName ];
                        if ( typeof NodeType === 'function' ) {
                            // 先将缓冲区中的text节点内容写入
                            flushTextBuf(); 
                            
                            if ( commandIsClose ) {
                                var closeNode = position.findReversed(
                                    isInstanceofNodeType
                                );
                                closeNode && closeNode.close( analyseContext );
                            }
                            else {
                                var openNode = new NodeType( commandValue, engine );
                                if ( typeof openNode.beforeOpen === 'function' ) {
                                    openNode.beforeOpen( analyseContext );
                                }
                                openNode.open( analyseContext );
                            }
                            NodeType = null;
                        }
                        else {
                            beNormalText( commentText );
                        }
                    }
                    else {
                        beNormalText( commentText );
                    }

                    textBuf.push( text.slice( closeIndex + commandCloseLen ) );
                }
                else {
                    textBuf.push( text );
                }
            }

            flushTextBuf(); // 将缓冲区中的text节点内容写入
            autoCloseCommand( analyseContext );

            return analyseContext.targets;
        }


        exports = module.exports = new Engine();

        /**
         * 执行模板渲染，并将渲染后的字符串作为innerHTML填充到HTML元素中。
         * 该方法的存在是为了兼容老版本的模板引擎api，不建议使用。
         * 
         * @param {HTMLElement} element 渲染字符串填充的HTML元素
         * @param {string} name target名称
         * @param {Object=} data 模板数据
         */
        exports.merge = function ( element, name, data ) {
            if ( element ) {
                element.innerHTML = this.render( name, data );
            }
        };

        exports.Engine = Engine;
    }
);

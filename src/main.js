/**
 * ETPL (Enterprise Template)
 * Copyright 2013 Baidu Inc. All rights reserved.
 * 
 * @file 模板引擎
 * @author errorrik(errorrik@gmail.com)
 */

// 有的正则比较长，所以特别放开一些限制
/* jshint maxdepth: 10, unused: false, white: false */

define(
    function ( require ) {
        /**
         * 对象属性拷贝
         * 
         * @inner
         * @param {Object} target 目标对象
         * @param {...Object} source 源对象
         * @return {Object} 返回目标对象
         */
        function extend( target ) {
            for ( var i = 1, len = arguments.length; i < len; i++ ) {
                var source = arguments[ i ];
                for ( var key in source ) {
                    if ( source.hasOwnProperty( key ) ) {
                        target[ key ] = source[ key ];
                    }
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
             * @param {*} elem 添加项
             */
            push: function ( elem ) {
                this.raw[ this.length++ ] = elem;
            },

            /**
             * 添加多个元素到数组末端
             * 
             * @param {...*} elem 添加项
             */
            pushMore: function () {
                for ( var i = 0, l = arguments.length; i < l; i++ ) {
                    this.push( arguments[ i ] );
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
             * 根据索引获取元素
             *
             * @param {number} index 数组索引
             * @return {*}
             */
            item: function ( index ) {
                return this.raw[ index ];
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
         * 命令文本格式规则
         * 
         * @inner
         * @const
         * @type {RegExp}
         */
        var COMMAND_RULE = /^\s*(\/)?([a-z]+)\s*(:(.*))?$/;

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
            return '___' + (guidIndex++) + '___';
        }

        /**
         * 节点状态
         * 
         * @inner
         */
        var NodeState = {
            UNDEF: 0,
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

        /**
         * 默认filter
         * 
         * @inner
         * @const
         * @type {Object}
         */
        var DEFAULT_FILTERS = {
            html: function ( source ) {
                source = source + '';
                return source
                    .replace( /&/g, '&amp;' )
                    .replace( /</g, '&lt;' )
                    .replace( />/g, '&gt;' )
                    .replace( /"/g, '&quot;' )
                    .replace( /'/g, '&#39;' );
            },
            url: encodeURIComponent
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

        /**
         * 文本节点renderer body模板串
         * 
         * @inner
         * @const
         * @type {string}
         */
        var TEXT_RENDERER_BODY = 'str.push(replaceVariables({0}));';

        /**
         * 文本节点类
         * 
         * @inner
         * @constructor
         * @param {string} value 文本节点的内容文本
         */
        function TextNode( value ) {
            this.value = value;
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
                return stringFormat( 
                    TEXT_RENDERER_BODY, 
                    stringLiteralize( this.value ) 
                );
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
                var commandNode;
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
         * 命令值规则：name，用于import、content、contentplaceholder命令
         * 
         * @inner
         * @const
         * @type {RegExp}
         */
        var COMMAND_VALUE_RULE_NAME = /^\s*([a-z0-9_-]+)\s*$/i;

        /**
         * 读取name形式的命令值
         * 
         * @inner
         * @param {Command} node 命令节点
         */
        function readNameOfCommandValue( node ) {
            if ( COMMAND_VALUE_RULE_NAME.test( node.value ) ) {
                node.name = RegExp.$1;
            }
        }

        /**
         * 命令值规则：name和master，用于target、master命令
         * 
         * @inner
         * @const
         * @type {RegExp}
         */
        var COMMAND_VALUE_RULE_NAME_AND_MASTER = 
            /^\s*([a-z0-9_-]+)\s*(\(\s*master\s*=\s*([a-z0-9_-]+)\s*\))?\s*/i;
        
        /**
         * 读取name和master形式的命令值
         * 
         * @inner
         * @param {Command} node 命令节点
         */
        function readNameAndMasterOfCommandValue( node ) {
            if ( COMMAND_VALUE_RULE_NAME_AND_MASTER.test( node.value ) ) {
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
        var RENDERER_BODY_START = [
            'data = data || {};',
            'var str = [];',
            'var variables = {};',

            'var getVariable = typeof data.get === "function"',
                '? function (name) {',
                    'return data.get(name);',
                '}',
                ': function (name) {',
                    'var props = name.split(".");',
                    'var firstProp = props[0];',
                    'var firstVariable = variables[firstProp];',
                    'var d = firstVariable == null',
                        '? data[firstProp] ',
                        ': firstVariable;',
                    'for (var i = 1, len = props.length; i < len; i++) {',
                        'if (d != null) {',
                            'd = d[ props[ i ] ];',
                        '}',
                    '}',
                    'return d;',
                '};',

            'function replaceVariables(s) {',
                'return s.replace(',
                    '/\\$\\{([^\\}]+)\\}/g,',
                    'function (match, expr){',
                        'var segs = expr.split("|");',
                        'var len = segs.length;',
                        'var name = segs[0];',
                        'var value = getVariable(name);',
                        'if (len === 1) { len = 2; segs[1]="html"; }',
                        'for (var i = 1; i < len; i++) {',
                            'value = engine.filter(segs[i], value);',
                        '}',
                        'return value;',
                    '}',
                ');',
            '}'
        ].join( '' );

        /**
         * renderer body结束代码段
         * 
         * @inner
         * @const
         * @type {string}
         */
        var RENDERER_BODY_END = 'return str.join("")';

        /**
         * Target命令节点类
         * 
         * @inner
         * @constructor
         * @param {string} value 命令节点的value
         * @param {Engine} engine 引擎实例
         */
        function TargetCommand( value, engine ) {
            if ( engine.targets[ name ] ) {
                throw new Error( 'target ' + name + ' is exists!' );
            }

            Command.call( this, value, engine );
            readNameAndMasterOfCommandValue( this );
            this.contents = {};
        }
        
        /**
         * target和master节点的闭合方法
         * 
         * @inner
         * @param {Object} context 语法分析环境对象
         */
        function targetAndMasterCloseMethod( context ) {
            Command.prototype.close.call( this, context );
            this.state = NodeState.READED;
            context.targetOrMaster = null;
        }

        /**
         * target和master节点的应用母版方法
         * 
         * @inner
         */
        function targetAndMasterApplyMasterMethod() {
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
        }

        TargetCommand.prototype = {
            /**
             * target节点open，解析开始
             * 
             * @param {Object} context 语法分析环境对象
             */
            open: function ( context ) {
                autoCloseCommand( context );
                Command.prototype.open.call( this, context );

                context.targetOrMaster = this;
                var name = this.name;
                context.targets.push( name );
                context.engine.targets[ name ] = this;
                this.state = NodeState.READING;
            },

            /**
             * 节点闭合，解析结束
             * 
             * @param {Object} context 语法分析环境对象
             */
            close: targetAndMasterCloseMethod,

            /**
             * 节点自动闭合，解析结束
             * 
             * @param {Object} context 语法分析环境对象
             */
            autoClose: targetAndMasterCloseMethod,

            /**
             * 应用其继承的母版
             */
            applyMaster: targetAndMasterApplyMasterMethod,

            /**
             * 获取target的renderer函数
             * 
             * @return {function(Object):string}
             */
            getRenderer: function () {
                if ( this.renderer ) {
                    return this.renderer;
                }

                var engine = this.engine;
                this.applyMaster();
                
                if ( this.state === NodeState.READY && this.isImportsReady() ) {
                    console.log(this.name)
                    console.log(RENDERER_BODY_START 
                        + this.getRendererBody() 
                        + RENDERER_BODY_END)

                    var realRenderer = new Function( 
                        'data', 'engine',
                        [
                            RENDERER_BODY_START,
                            this.getRendererBody(),
                            RENDERER_BODY_END
                        ].join( '\n' )
                    );

                    this.renderer = function ( data ) {
                        return realRenderer.call( this, data, engine );
                    };
debugger;
                    return this.renderer;
                }

                return null;
            },

            /**
             * 判断target的imports是否准备完成
             * 
             * @return {boolean}
             */
            isImportsReady: function () {
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
                        if ( child instanceof ImportCommand ) {
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
                debugger;
                return readyState;
            }
        };

        // 创建Target命令节点继承关系
        inherits( TargetCommand, Command );

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
            readNameOfCommandValue( this );
        }

        ImportCommand.prototype = {
            /**
             * import节点open，解析开始
             * 
             * @param {Object} context 语法分析环境对象
             */
            open: function ( context ) {
                var parent = context.position.top();
                this.parent = parent;
                parent.addChild( this );
            },

            /**
             * import节点解析结束
             * 由于import节点无需闭合，处理时不会入栈，所以将close置为空函数
             * 
             * @param {Object} context 语法分析环境对象
             */
            close: new Function(),

            /**
             * 获取renderer body的生成代码
             * 
             * @return {string}
             */
            getRendererBody: function () {
                var target = this.engine.targets[ this.name ];
                return target.getRendererBody();
            },

            /**
             * 节点open前的处理动作
             * 
             * @param {Object} context 语法分析环境对象
             */
            beforeOpen: autoCreateTarget
        };

        // 创建Import命令节点继承关系
        inherits( ImportCommand, Command );

        /**
         * Master命令节点类
         * 
         * @inner
         * @constructor
         * @param {string} value 命令节点的value
         * @param {Engine} engine 引擎实例
         */
        function MasterCommand( value, engine ) {
            Command.call( this, value, engine );
            readNameAndMasterOfCommandValue( this );
            this.realChildren = this.children;
            this.contents = {};
        }

        MasterCommand.prototype = {
            /**
             * master节点open，解析开始
             * 
             * @param {Object} context 语法分析环境对象
             */
            open: function ( context ) {
                if ( context.engine.masters[ name ] ) {
                    throw new Error( 'master ' + name + ' is exists!' );
                }

                autoCloseCommand( context );
                Command.prototype.open.call( this, context );

                var name = this.name;
                context.targetOrMaster = this;
                context.engine.masters[ name ] = this;
                this.state = NodeState.READING;
            },

            /**
             * 节点闭合，解析结束
             * 
             * @param {Object} context 语法分析环境对象
             */
            close: targetAndMasterCloseMethod,

            /**
             * 节点自动闭合，解析结束
             * 
             * @param {Object} context 语法分析环境对象
             */
            autoClose: targetAndMasterCloseMethod,

            /**
             * 应用其继承的母版
             */
            applyMaster: targetAndMasterApplyMasterMethod
        };
        
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
            readNameOfCommandValue( this );
        }
        
        ContentCommand.prototype = {
            /**
             * content节点open，解析开始
             * 
             * @param {Object} context 语法分析环境对象
             */
            open: function ( context ) {
                autoCloseCommand( context, ContentCommand );
                Command.prototype.open.call( this, context );
                context.targetOrMaster.contents[ this.name ] = this;
            },

            /**
             * 节点自动闭合，解析结束
             * 
             * @param {Object} context 语法分析环境对象
             */
            autoClose: Command.prototype.close
        };

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
            readNameOfCommandValue( this );
        }

        ContentPlaceHolderCommand.prototype = {
            /**
             * content节点open，解析开始
             * 
             * @param {Object} context 语法分析环境对象
             */
            open: function ( context ) {
                var parent = context.position.top();
                if ( parent instanceof TargetCommand
                     || parent instanceof MasterCommand
                     || parent instanceof ContentCommand
                ) {
                    autoCloseCommand( context, ContentPlaceHolderCommand );
                    Command.prototype.open.call( this, context );
                }
                else {
                    throw new Error( 'contentplaceholder cannot in ' + parent.type );
                }
            },

            /**
             * 节点自动闭合，解析结束
             * contentplaceholder的自动结束逻辑为，在其开始位置后马上结束
             * 所以，其自动结束时children应赋予其所属的parent，也就是master
             * 
             * @param {Object} context 语法分析环境对象
             */
            autoClose: function ( context ) {
                var parentChildren = this.parent.children;
                parentChildren.push.apply( parentChildren, this.children );
                this.children.length = 0;
                this.close( context );
            }
        };

        // 创建ContentPlaceHolder命令节点继承关系
        inherits( ContentPlaceHolderCommand, Command );

        /**
         * 命令值规则：for，用于for命令
         * 
         * @inner
         * @const
         * @type {RegExp}
         */
        var COMMAND_VALUE_RULE_FOR = /^\s*\$\{([0-9a-z_.\[\]]+)\}\s+as\s+\$\{([0-9a-z_]+)\}\s*(,\s*\$\{([0-9a-z_]+)\})?\s*$/i;
        
        /**
         * for命令节点类
         * 
         * @inner
         * @constructor
         * @param {string} value 命令节点的value
         * @param {Engine} engine 引擎实例
         */
        function ForCommand( value, engine ) {
            Command.call( this, value, engine );
            if ( COMMAND_VALUE_RULE_FOR.test( this.value ) ) {
                this.list = RegExp.$1;
                this.item = RegExp.$2;
                this.index = RegExp.$4;
            }
            else {
                throw new Error( 'invalid "for" syntax: ' + this.value );
            }
        }

        /**
         * for节点renderer body模板串
         * 
         * @inner
         * @const
         * @type {string}
         */
        var FOR_RENDERER_BODY = [
            'var {0} = getVariable({1});',
            'if ({0} instanceof Array) {',
                'for (',
                    'variables[{2}] = 0, variables[{3}] = {0}.length;',
                    'variables[{2}] < variables[{3}];',
                    'variables[{2}]++',
                '){',
                    'variables[{4}] = {0}[variables[{2}]];',
                    '{5}',
                '}',
            '}'
        ].join('');

        ForCommand.prototype = {
            /**
             * 节点open前的处理动作
             * 
             * @param {Object} context 语法分析环境对象
             */
            beforeOpen: autoCreateTarget,

            /**
             * 获取renderer body的生成代码
             * 
             * @return {string}
             */
            getRendererBody: function () {
                return stringFormat(
                    FOR_RENDERER_BODY,
                    generateGUID(),
                    stringLiteralize( this.list ),
                    stringLiteralize( this.index || generateGUID() ),
                    stringLiteralize( generateGUID() ),
                    stringLiteralize( this.item ),
                    Command.prototype.getRendererBody.call( this )
                );
            }
        };

        // 创建for命令节点继承关系
        inherits( ForCommand, Command );

        /**
         * 命令值规则：if，用于if、elif命令
         * 
         * @inner
         * @const
         * @type {RegExp}
         */
        var COMMAND_VALUE_RULE_IF = /^\s*([>=<!0-9a-z$\{\}\[\]\(\):\s'"\.\|&_]+)\s*$/i;
        
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
            if ( COMMAND_VALUE_RULE_IF.test( this.value ) ) {
                this.value = RegExp.$1;
            }
            else {
                throw new Error( 'invalid conditional syntax: ' + this.value );
            }
        }

        /**
         * if的renderer body模板串
         * 
         * @inner
         * @const
         * @type {string}
         */
        var IF_RENDERER_BODY = 'if ({0}) {{1}}';

        /**
         * else的renderer body模板串
         * 
         * @inner
         * @const
         * @type {string}
         */
        var ELSE_RENDERER_BODY = 'else {{0}}';

        var GET_VARIABLE_TPL = 'getVariable({0})';

        IfCommand.prototype = {
            /**
             * 节点open前的处理动作
             * 
             * @param {Object} context 语法分析环境对象
             */
            beforeOpen: autoCreateTarget,

            /**
             * 添加子节点
             * 
             * @param {TextNode|Command} node 子节点
             */
            addChild: function ( node ) {
                var elseCommand = this[ 'else' ];
                ( elseCommand 
                    ? elseCommand.children 
                    : this.children
                ).push( node );
            },

            /**
             * 获取renderer body的生成代码
             * 
             * @return {string}
             */
            getRendererBody: function () {
                var rendererBody = stringFormat(
                    IF_RENDERER_BODY,
                    this.value.replace(
                        /\$\{([0-9a-z_\.]+)\}/g,
                        function( match, name ){
                            return stringFormat(
                                GET_VARIABLE_TPL,
                                stringLiteralize( name )
                            );
                        }
                    ),
                    Command.prototype.getRendererBody.call( this )
                );

                var elseCommand = this[ 'else' ];
                if ( elseCommand ) {
                    return [
                        rendererBody,
                        stringFormat( 
                            ELSE_RENDERER_BODY,
                            elseCommand.getRendererBody()
                        )
                    ].join( '' );
                }

                return rendererBody;
            }
        };

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

        ElifCommand.prototype = {
            /**
             * elif节点open，解析开始
             * 
             * @param {Object} context 语法分析环境对象
             */
            open: function ( context ) {
                var ifCommand = context.position.top();
                if ( !( ifCommand instanceof IfCommand ) ) {
                    throw new Error( ifCommand.type + ' have not been closed!' );
                }

                var elseCommand = new ElseCommand( null, this.engine );
                elseCommand.open( context );
                ifCommand.addChild( this );
                context.position.pop();
                context.position.push( this );
            }
        };

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

        ElseCommand.prototype = {
            /**
             * else节点open，解析开始
             * 
             * @param {Object} context 语法分析环境对象
             */
            open: function ( context ) {
                var ifCommand = context.position.top();
                if ( !( ifCommand instanceof IfCommand ) ) {
                    throw new Error( ifCommand.type + ' have not been closed!' );
                }
                
                ifCommand[ 'else' ] = this;
            },

            /**
             * else节点解析结束
             * 由于else节点无需闭合，处理时不会入栈，闭合由if负责。所以将close置为空函数
             * 
             * @param {Object} context 语法分析环境对象
             */
            close: new Function()
        };

        // 创建else命令节点继承关系
        inherits( ElseCommand, Command );

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
        addCommandType( 'import', ImportCommand );
        addCommandType( 'for', ForCommand );
        addCommandType( 'if', IfCommand );
        addCommandType( 'elif', ElifCommand );
        addCommandType( 'else', ElseCommand );
        addCommandType( 'content', ContentCommand );
        addCommandType( 'contentplaceholder', ContentPlaceHolderCommand );
        
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
                commandClose: '-->'
            };

            extend( this.options, options );
            this.masters = {};
            this.targets = {};
            this.filters = extend({}, DEFAULT_FILTERS);
        }

        Engine.prototype = {
            // 暴露出去的类，进行constructor修正
            constructor: Engine,

            /**
             * 编译模板。返回第一个target编译后的renderer函数
             * 
             * @param {string} source 模板源代码
             * @return {function(Object):string}
             */
            compile: function ( source ) {
                var targetNames = parseSource( source, this );
                if ( targetNames.length ) {
                    var firstTarget = this.targets[ targetNames[ 0 ] ];
                    return firstTarget.getRenderer();
                }
            },

            /**
             * 根据target名称获取编译后的renderer函数
             * 
             * @param {string} name target名称
             * @return {function(Object):string}
             */
            getRenderer: function ( name ) {
                var target = this.targets[ name ];
                if ( target ) {
                    return target.getRenderer();
                }
            },

            /**
             * 增加过滤器
             * 
             * @param {string} name 过滤器名称
             * @param {function(string):string} filter 过滤函数
             */
            addFilter: function ( name, filter ) {
                this.filters[ name ] = filter;
            },

            /**
             * 字符串过滤处理
             * 
             * @param {string} name 过滤器名称
             * @param {string} source 源字符串
             * @return {string}
             */
            filter: function ( name, source ) {
                var filter = this.filters[ name ];
                if ( typeof filter === 'function' ) {
                    return filter( source );
                }

                return source;
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
                    var textNode = new TextNode( text );
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
                textBuf.pushMore( commandOpen, text, commandClose );
            }

            // 先以 commandOpen(默认<!--) 进行split
            var texts = source.split( commandOpen );
            var i = 0;
            var len = texts.length;
            if ( texts[ 0 ].length === 0 ) {
                i++;
            }

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

            for ( ; i < len; i++ ) {
                // 对 commandOpen(默认<!--) 进行split的结果
                // 挨个用 commandClose(默认-->) 进行split
                // 如果split数组长度为2，则0项为注释内容，1项为正常html内容
                var str = texts[i].split( commandClose );
                var strLen = str.length;

                if ( strLen === 2 ) {
                    var commentText = str[ 0 ];
                    if ( COMMAND_RULE.test( commentText ) ) {
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

                    textBuf.push( str[ 1 ] );
                }
                else {
                    textBuf.push( str[ 0 ] );
                }
            }

            flushTextBuf(); // 将缓冲区中的text节点内容写入
            autoCloseCommand( analyseContext );

            return analyseContext.targets;
        }

        var defaultEngine = new Engine();
        
        return defaultEngine;
    }
);

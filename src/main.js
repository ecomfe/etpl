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
         * [ext description]
         * 
         * @inner
         * @param {[type]} target [target description]
         * @return {[type]} [return description]
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
        }

        /**
         * 随手写了个数组作为string buffer和stack
         *
         * @inner
         */
        function ArrayBuffer() {
            this.raw = [];
            this.length = 0;
        }

        ArrayBuffer.prototype = {
            /**
             * 添加元素到数组末端
             *
             * @param {Any} elem 添加项
             */
            push: function ( elem ) {
                this.raw[ this.length++ ] = elem;
            },

            /**
             * 添加多个元素到数组末端
             */
            pushMore: function () {
                for ( var i = 0, l = arguments.length; i < l; i++ ) {
                    this.push( arguments[ i ] );
                }
            },

            /**
             * 弹出顶部元素
             *
             * @return {Any}
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
             * @return {Any}
             */
            top: function () {
                return this.raw[ this.length - 1 ];
            },

            /**
             * 获取底部元素
             *
             * @return {Any}
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
             * 获取源数组
             *
             * @return {Array}
             */
            getRaw: function () {
                return this.raw;
            },

            /**
             * 根据索引获取元素
             *
             * @param {number} index 数组索引
             * @return {Any}
             */
            item: function ( index ) {
                return this.raw[ index ];
            },

            /**
             * 根据查询条件获取元素，逆序查找
             * 
             * @param {Function} condition 查询函数
             * @return {Any}
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

        var COMMAND_RULE = /^\s*(\/)?([a-z]+)\s*(:(.*))?$/;

        var guidIndex = 0xCADB7;
        function generateGUID() {
            return '___' + (guidIndex++) + '___';
        }

        /**
         * 节点类型声明
         * 
         * @inner
         * @const
         */
        var NodeType = {
            TEXT: 1,
            TARGET: 2,
            MASTER: 3,
            IMPORT: 4,
            CONTENT: 5,
            CONTENTPLACEHOLDER: 6,
            FOR: 7,
            IF: 8,
            ELIF: 9,
            ELSE: 10
        };

        var NodeState = {
            UNDEF: 0,
            READING: 1,
            READED: 2,
            READY: 3
        };

        function inherits( subClass, superClass ) {
            var F = new Function();
            F.prototype = superClass.prototype;
            var subClassPrototype = subClass.prototype;

            subClass.prototype = new F();
            subClass.prototype.constructor = subClass;
            extend( subClass.prototype, subClassPrototype );
        }

        var defaultFilters = {
            html: function (source) {
                source = source + '';
                return source
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
            },
            url: encodeURIComponent
        };

        function autoCreateTarget( context ) {
            if ( context.position.bottom() ) {
                return;
            }

            var target = new TargetCommand( generateGUID() );
            target.open( context );
        }

        function TextNode( value ) {
            this.value = value;
        }

        TextNode.prototype.beforeAdd = autoCreateTarget;
        TextNode.prototype.getRendererBody = function () {
            return 'str.push(replaceVariables("'
                + this.value.replace( '"', '\\"' ) 
                + '"));';
        };

        function Command( value, engine ) {
            this.value = value;
            this.engine = engine;
            this.children = [];
            this.realChildren = this.children;
        }

        Command.prototype.addChild = function ( node ) {
            this.children.push( node );
        };

        Command.prototype.open = function ( context ) {
            var parent = context.position.top();
            this.parent = parent;
            parent && parent.addChild( this );
            context.position.push( this );
        };

        Command.prototype.close = function ( context ) {
            var commandNode;
            while ( context.position.pop().constructor !== this.constructor
            ) { 
                ;
            }
        };

        Command.prototype.addTextNode = function ( node ) {
            this.addChild( node );
        };

        var NAME_RULE = /^\s*([a-z0-9_-]+)\s*$/i;
        function readName( node ) {
            if ( NAME_RULE.test( node.value ) ) {
                node.name = RegExp.$1;
            }
        }

        var NAME_AND_MASTER_RULE = /^\s*([a-z0-9_-]+)\s*(\(\s*master\s*=\s*([a-z0-9_-]+)\s*\))?\s*/i;
        function readNameAndMaster( node ) {
            if ( NAME_AND_MASTER_RULE.test( node.value ) ) {
                node.name = RegExp.$1;
                if ( RegExp.$2 ) {
                    node.master = RegExp.$3;
                }
            }
        }

        function TargetCommand( value, engine ) {
            Command.call( this, value, engine );
            
            this.contents = {};
            this.imports = {};
            readNameAndMaster( this );
        }

        inherits( TargetCommand, Command );
        
        TargetCommand.prototype.open = function ( context ) {
            var name = this.name;
            if ( context.engine.targets[ name ] ) {
                throw new Error( 'target ' + name + ' is exists!' );
            }

            autoCloseCommand( context );
            Command.prototype.open.call( this, context );
            context.targets.push( name );
            context.engine.targets[ name ] = this;
            this.state = NodeState.READING;
            context.targetOrMaster = this;
        };

        TargetCommand.prototype.close = 
        TargetCommand.prototype.autoClose = function ( context ) {
            Command.prototype.close.call( this, context );
            this.state = NodeState.READED;
            context.target = null;
        };

        var RENDERER_BODY_START = [
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
                    'var d = firstVariable == null ? data[firstProp] : firstVariable;',
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
                        'for (var i = 1; i < len; i++) {',
                            'value = engine.filter(segs[i], value);',
                        '}',
                        'return value;',
                    '}',
                ');',
            '}'
        ].join( '' );

        var RENDERER_BODY_END = 'return str.join("")';
        TargetCommand.prototype.getRenderer = function () {
            var engine = this.engine;
            this.applyMaster( engine );
            
            if ( this.state === NodeState.READY ) {
                if ( this.renderer ) {
                    return this.renderer;
                }
debugger

                if ( this.isImportsReady( engine ) ) {
                    console.log(RENDERER_BODY_START + this.getRendererBody() + RENDERER_BODY_END)
                    var realRenderer = new Function( 
                        'data', 'engine',
                        RENDERER_BODY_START + this.getRendererBody() + RENDERER_BODY_END
                    );
                    this.renderer = function ( data ) {
                        return realRenderer.call( this, data, engine );
                    }; 
                    return this.renderer;
                }
            }

            return null;
        };

        TargetCommand.prototype.getRendererBody = function () {
            var rendererBody = new ArrayBuffer();
            for ( var i = 0; i < this.realChildren.length; i++ ) {
                rendererBody.push( this.realChildren[ i ].getRendererBody() );
            }

            return rendererBody.join( '' );
        };

        TargetCommand.prototype.isImportsReady = function () {
            if ( this.state < NodeState.READY ) {
                return false;
            }

            var readyState = true;
            var engine = this.engine;

            function checkReadyState( commandNode ) {
                var children = commandNode.realChildren || commandNode.children;
                for ( var i = 0, len = children.length; i < len; i++ ) {
                    var child = children[ i ];
                    if ( child instanceof ImportCommand ) {
                        var target = engine.targets[ child.name ];
                        readyState = readyState && target && target.isImportsReady( engine );
                    }
                    else if ( child instanceof Command ) {
                        checkReadyState( child );
                    }
                }
            }

            checkReadyState( this );
            return readyState;
        };

        function ImportCommand( value, engine ) {
            Command.call( this, value, engine );
            readName( this );
        }

        ImportCommand.prototype.open = function ( context ) {
            this.parent = context.position.top();
        };

        ImportCommand.prototype.close = function () {};

        ImportCommand.prototype.getRendererBody = function () {
            var target = this.engine.targets[ this.name ];
            return target.getRendererBody();
        };

        ImportCommand.prototype.beforeOpen = autoCreateTarget;

        inherits( ImportCommand, Command );

        function MasterCommand( value, engine ) {
            Command.call( this, value, engine );
            readNameAndMaster( this );
            this.realChildren = this.children;
            this.contents = {};
        }

        inherits( MasterCommand, Command );

        MasterCommand.prototype.applyMaster = 
        TargetCommand.prototype.applyMaster = function () {
            if ( this.state === NodeState.READY ) {
                return;
            }

            if ( this.master ) {
                var masterNode = this.engine.masters[ this.master ];
                masterNode.applyMaster();

                if ( masterNode.state === NodeState.READY ) {
                    var masterChildren = masterNode.realChildren;
                    this.realChildren = [];

                    for ( var i = 0, len = masterChildren.length; i < len; i++ ) {
                        var child = masterChildren[ i ];

                        if ( child instanceof ContentPlaceHolderCommand ) {
                            var contentNode = this.contents[ child.name ];
                            
                            this.realChildren.push.apply( 
                                this.realChildren, 
                                (contentNode || child).children
                            );
                        }
                        else {
                            this.realChildren.push( child );
                        }
                    }
                }
                else {
                    return;
                }
            }

            this.state = NodeState.READY;
        };

        MasterCommand.prototype.open = function ( context ) {
            var name = this.name;
            if ( context.engine.masters[ name ] ) {
                throw new Error( 'master ' + name + ' is exists!' );
            }

            autoCloseCommand( context );
            Command.prototype.open.call( this, context );
            context.targetOrMaster = this;
            context.engine.masters[ name ] = this;
            this.state = NodeState.READING;
        };

        MasterCommand.prototype.close = 
        MasterCommand.prototype.autoClose = function ( context ) {
            Command.prototype.close.call( this, context );
            this.state = NodeState.READED;
        };

        function ContentCommand( value, engine ) {
            Command.call( this, value, engine );
            readName( this );
        }

        inherits( ContentCommand, Command );


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

            do {
                var closeNode = position.top();
                if ( !closeNode.autoClose ) {
                    throw new Error( closeNode.type + ' must be closed manually!' );
                }
                closeNode.autoClose( context );
            } while ( closeNode !== closeEnd );
        }

        ContentCommand.prototype.open = function ( context ) {
            autoCloseCommand( context, ContentCommand );
            Command.prototype.open.call( this, context );
            context.targetOrMaster.contents[ this.name ] = this;
        };

        ContentCommand.prototype.autoClose = ContentCommand.prototype.close;


        function ContentPlaceHolderCommand( value, engine ) {
            Command.call( this, value, engine );
            readName( this );
        }
        inherits( ContentPlaceHolderCommand, Command );

        ContentPlaceHolderCommand.prototype.open = function ( context ) {
            var parent = context.position.top();
            if ( parent instanceof TargetCommand
                 || parent instanceof MasterCommand
                 || parent instanceof ContentCommand
            ) {
                autoCloseCommand( context, ContentPlaceHolderCommand );
                Command.prototype.open.call( this, context );
                context.targetOrMaster.contents[ this.name ] = this;
            }
            else {
                throw new Error( 'contentplaceholder cannot in ' + parent.type );
            }
        };

        ContentPlaceHolderCommand.prototype.autoClose = function ( context ) {
            var parentChildren = this.parent.children;
            parentChildren.push.apply( parentChildren, this.children );
            this.children.length = 0;
            this.close( context );
        };


        var FOR_VALUE_RULE = /^\s*\$\{([0-9a-z_.\[\]]+)\}\s+as\s+\$\{([0-9a-z_]+)\}\s*(,\s*\$\{([0-9a-z_]+)\})?\s*$/i;
        function ForCommand( value, engine ) {
            Command.call( this, value, engine );
            if ( FOR_VALUE_RULE.test( this.value ) ) {
                this.list = RegExp.$1;
                this.item = RegExp.$2;
                this.index = RegExp.$4;
            }
        }
        inherits( ForCommand, Command );

        ForCommand.prototype.beforeOpen = autoCreateTarget;

        ForCommand.prototype.getRendererBody = function () {
            var list = this.list.replace(/"/g, '\\"');
            var item = this.item;
            var index = this.index || generateGUID();
            var len = generateGUID();
            var listVariable = generateGUID();

            return 'var ' + listVariable + ' = getVariable("' + this.list + '");'
                + 'if ('+ listVariable + ' instanceof Array) {'
                + 'for (variables["' + index + '"]=0, variables["'+len+'"]='+ listVariable + '.length;variables["' + index + '"] < variables["'+len+'"]; variables["' + index + '"]++){'
                    + 'variables["' + item + '"] = '+ listVariable + '[variables["' + index + '"]];'
                    + TargetCommand.prototype.getRendererBody.call( this )
                + '}'
            + '}';
        };

        var IF_VALUE_RULE = /^\s*([>=<!0-9a-z$\{\}\[\]\(\):\s'"\.\|&_]+)\s*$/i;
        function IfCommand( value, engine ) {
            Command.call( this, value, engine );
            if ( IF_VALUE_RULE.test( this.value ) ) {
                this.value = RegExp.$1;
            }
        }

        inherits( IfCommand, Command );

        IfCommand.prototype.addChild = function ( node ) {
            (this[ 'else' ] ? this['else'].children : this.children).push( node );
        };

        IfCommand.prototype.beforeOpen = autoCreateTarget;

        IfCommand.prototype.getRendererBody = function () {
            var rendererBody = new ArrayBuffer();
            rendererBody.push( 'if (' + this.value.replace(/\$\{([0-9a-z_\.]+)\}/g,function($0,name){
                return 'getVariable("' + name.replace(/"/g, '\\"') + '")';
            }) + '){');
            rendererBody.push(TargetCommand.prototype.getRendererBody.call( this ));
            rendererBody.push('}');

            if (this['else']) {
                rendererBody.push('else {');
                rendererBody.push(this['else'].getRendererBody());
                rendererBody.push('}');
            }
            return rendererBody.join('');
        };

        function ElifCommand( value, engine ) {
            Command.call( this, value, engine );
            if ( IF_VALUE_RULE.test( this.value ) ) {
                this.value = RegExp.$1;
            }
        }

        inherits( ElifCommand, IfCommand );

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

        function ElseCommand( value, engine ) {
            Command.call( this, value, engine );
        }
        inherits( ElseCommand, Command );

        ElseCommand.prototype.open = function ( context ) {
            var ifCommand = context.position.top();
            if ( !( ifCommand instanceof IfCommand ) ) {
                throw new Error( ifCommand.type + ' have not been closed!' );
            }
            
            ifCommand[ 'else' ] = this;
        };

        ElseCommand.prototype.getRendererBody = TargetCommand.prototype.getRendererBody;


        var commandTypes = {};

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
         * [Engine description]
         * 
         * @constructor
         * @param {[type]} options [options description]
         */
        function Engine( options ) {
            this.options = {
                commandOpen: '<!--',
                commandClose: '-->'
            };

            extend( this.options, options );
            this.masters = {};
            this.targets = {};
            this.filters = extend({}, defaultFilters);
        }

        /**
         * [compile description]
         * 
         * @param {[type]} source [source description]
         * @return {Function}
         */
        Engine.prototype.compile = function ( source ) {
            var targetNames = parseSource( source, this );
            var a = this.targets[ targetNames[ 0 ] ].getRenderer( this );
debugger;
            return a;
        };

        Engine.prototype.addFilter = function ( name, filter ) {
            this.filters[ name ] = filter;
        };

        Engine.prototype.filter = function ( name, source ) {
            var filter = this.filters[ name ];
            if ( typeof filter === 'function' ) {
                return filter( source );
            }

            return source;
        };

        function parseSource( source, engine ) {
            var commandOpen = engine.options.commandOpen;
            var commandClose = engine.options.commandClose;

            var analyseContext = {
                engine: engine,
                targets: [],
                position: new ArrayBuffer()
            };

            // node结果流
            var nodeStream = new ArrayBuffer();

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
                    analyseContext.position.top().addTextNode( textNode );
                    nodeStream.push( textNode );
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
                textBuf.pushMore(commandOpen, text, commandClose);
            }

            // 先以 commandOpen(默认<!--) 进行split
            var texts = source.split( commandOpen );
            var i = 0;
            var len = texts.length;
            if ( texts[ 0 ].length === 0 ) {
                i++;
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

                        var NodeClass = commandTypes[ commandName ];
                        if ( typeof NodeClass === 'function' ) {
                            // 先将缓冲区中的text节点内容写入
                            flushTextBuf(); 
                            
                            if ( commandIsClose ) {
                                var closeNode = analyseContext.position.findReversed(
                                    function ( item ) {
                                        return item instanceof NodeClass;
                                    }
                                );
                                closeNode && closeNode.close( analyseContext );
                            }
                            else {
                                var openNode = new NodeClass( commandValue, engine );
                                if ( typeof openNode.beforeOpen === 'function' ) {
                                    openNode.beforeOpen( analyseContext );
                                }
                                openNode.open( analyseContext );
                                nodeStream.push( openNode );
                            }
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

        /**
         * [get description]
         * 
         * @param {[type]} name [name description]
         * @return {[type]} [return description]
         */
        Engine.prototype.get = function ( name ) {

        };

        var defaultEngine = new Engine();
        
        return {
            compile: function ( source ) {
                return defaultEngine.compile( source );
            },

            get: function ( name ) {
                return defaultEngine.get( name );
            }
        };
    }
);

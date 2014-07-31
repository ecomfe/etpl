(function (root) {
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
     * 随手写了个栈
     *
     * @inner
     * @constructor
     */
    function Stack() {
        this.raw = [];
        this.length = 0;
    }

    Stack.prototype = {
        /**
         * 添加元素进栈
         *
         * @param {*} elem 添加项
         */
        push: function ( elem ) {
            this.raw[ this.length++ ] = elem;
        },

        /**
         * 弹出顶部元素
         *
         * @return {*}
         */
        pop: function () {
            if ( this.length > 0 ) {
                var elem = this.raw[ --this.length ];
                this.raw.length = this.length;
                return elem;
            }
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
         * 根据查询条件获取元素
         * 
         * @param {Function} condition 查询函数
         * @return {*}
         */
        find: function ( condition ) {
            var index = this.length;
            while ( index-- ) {
                var item = this.raw[ index ];
                if ( condition( item ) ) {
                    return item;
                }
            }
        }
    };

    /**
     * 唯一id的起始值
     * 
     * @inner
     * @type {number}
     */
    var guidIndex = 0x2B845;

    /**
     * 获取唯一id，用于匿名target或编译代码的变量名生成
     * 
     * @inner
     * @return {string}
     */
    function generateGUID() {
        return '___' + (guidIndex++);
    }

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
        subClass.prototype = new F();
        subClass.prototype.constructor = subClass;
        // 由于引擎内部的使用场景都是inherits后，逐个编写子类的prototype方法
        // 所以，不考虑将原有子类prototype缓存再逐个拷贝回去
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
     * 解析文本片段中以固定字符串开头和结尾的包含块
     * 用于 命令串：<!-- ... --> 和 变量替换串：${...} 的解析
     * 
     * @inner
     * @param {string} source 要解析的文本
     * @param {string} open 包含块开头
     * @param {string} close 包含块结束
     * @param {boolean} greedy 是否贪婪匹配
     * @param {function({string})} onInBlock 包含块内文本的处理函数
     * @param {function({string})} onOutBlock 非包含块内文本的处理函数
     */
    function parseTextBlock( source, open, close, greedy, onInBlock, onOutBlock ) {
        var closeLen = close.length;
        var texts = source.split( open ); 
        var level = 0;
        var buf = [];

        for ( var i = 0, len = texts.length; i < len; i++ ) {
            var text = texts[ i ];

            if ( i ) {
                var openBegin = 1;
                level++;
                while ( 1 ) {
                    var closeIndex = text.indexOf( close );
                    if ( closeIndex < 0 ) {
                        buf.push( level > 1 && openBegin ? open : '', text );
                        break;
                    }

                    level = greedy ? level - 1 : 0;
                    buf.push( 
                        level > 0 && openBegin ? open : '',
                        text.slice( 0, closeIndex ),
                        level > 0 ? close : ''
                    );
                    text = text.slice( closeIndex + closeLen );
                    openBegin = 0;

                    if ( level === 0 ) {
                        break;
                    }
                }

                if ( level === 0 ) {
                    onInBlock( buf.join( '' ) );
                    onOutBlock( text );
                    buf = [];
                }
            }
            else {
                text && onOutBlock( text );
            }
        }

        if ( level > 0 && buf.length > 0 ) {
            onOutBlock( open );
            onOutBlock( buf.join( '' ) );
        }
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
         * 获取内容
         * 
         * @return {string}
         */
        getConvertedContent: function ( engine ) {
            return this.value;
        },

        /**
         * 文本节点被添加到分析环境前的处理动作：节点不在target中时，自动创建匿名target
         * 
         * @param {Object} context 语法分析环境对象
         */
        beforeAdd:  function ( context ) {
            if ( context.stack.bottom() ) {
                return;
            }

            var target = new TargetCommand( generateGUID(), context.engine );
            target.open( context );
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
            var parent = context.stack.top();
            this.parent = parent;
            parent && parent.addChild( this );
            context.stack.push( this );
        },

        /**
         * 节点闭合，解析结束
         * 
         * @param {Object} context 语法分析环境对象
         */
        close: function ( context ) {
            while (context.stack.pop().constructor !== this.constructor) {}
        },

        /**
         * 添加文本节点
         * 
         * @param {TextNode} node 节点
         */
        addTextNode: function ( node ) {
            this.addChild( node );
        }
    };

    /**
     * 命令自动闭合
     * 
     * @inner
     * @param {Object} context 语法分析环境对象
     * @param {Function=} CommandType 自闭合的节点类型
     */
    function autoCloseCommand( context, CommandType ) {
        var stack = context.stack;
        var closeEnd = CommandType 
            ? stack.find( function ( item ) {
                return item instanceof CommandType;
            } ) 
            : stack.bottom();

        if ( closeEnd ) {
            var node;

            do {
                node = stack.top();

                // 如果节点对象不包含autoClose方法
                // 则认为该节点不支持自动闭合，需要抛出错误
                // for等节点不支持自动闭合
                if ( !node.autoClose ) {
                    throw new Error( node.type + ' must be closed manually: ' + node.value );
                }
                node.autoClose( context );
            } while ( node !== closeEnd );
        }

        return closeEnd;
    }

    /**
     * Target命令节点类
     * 
     * @inner
     * @constructor
     * @param {string} value 命令节点的value
     * @param {Engine} engine 引擎实例
     */
    function TargetCommand( value, engine ) {
        if ( !/^\s*([a-z0-9_-]+)\s*(\(\s*master\s*=\s*([a-z0-9_-]+)\s*\))?\s*/i.test( value ) ) {
            throw new Error( 'Invalid ' + this.type + ' syntax: ' + value );
        }
        
        this.master = RegExp.$3;
        this.name = RegExp.$1;
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
        if ( !/^\s*([a-z0-9_-]+)\s*(\(\s*master\s*=\s*([a-z0-9_-]+)\s*\))?\s*/i.test( value ) ) {
            throw new Error( 'Invalid ' + this.type + ' syntax: ' + value );
        }
        
        this.master = RegExp.$3;
        this.name = RegExp.$1;
        Command.call( this, value, engine );
        this.contents = {};
    }

    // 创建Master命令节点继承关系
    inherits( MasterCommand, Command );


    TargetCommand.prototype.getConvertedContent =

    /**
     * 获取内容
     * 
     * @return {string}
     */
    MasterCommand.prototype.getConvertedContent = function (engine) {
        var targetTpl = engine.options.targetTpl;
        var targetWithMasterTpl = engine.options.targetWithMasterTpl;

        var buf = [];
        var children = this.children;
        for ( var i = 0; i < children.length; i++ ) {
            buf.push( children[ i ].getConvertedContent(engine) ); 
        }

        var content = buf.join( '' );

        var tpl = this.master
                    ? targetWithMasterTpl
                    : targetTpl;
        var head = stringFormat(tpl, this.name, this.master || '');

        return head + content;
    };


    /**
     * Content命令节点类
     * 
     * @inner
     * @constructor
     * @param {string} value 命令节点的value
     * @param {Engine} engine 引擎实例
     */
    function ContentCommand( value, engine ) {
        if ( !/^\s*([a-z0-9_-]+)\s*$/i.test( value ) ) {
            throw new Error( 'Invalid ' + this.type + ' syntax: ' + value );
        }

        this.name = RegExp.$1;
        Command.call( this, value, engine );
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
        if ( !/^\s*([a-z0-9_-]+)\s*$/i.test( value ) ) {
            throw new Error( 'Invalid ' + this.type + ' syntax: ' + value );
        }

        this.name = RegExp.$1;
        Command.call( this, value, engine );
    }

    // 创建ContentPlaceHolder命令节点继承关系
    inherits( ContentPlaceHolderCommand, Command );

    ContentCommand.prototype.getConvertedContent =

    /**
     * 获取内容
     * 
     * @return {string}
     */
    ContentPlaceHolderCommand.prototype.getConvertedContent = function (engine) {
        var buf = [];
        var children = this.children;
        for ( var i = 0; i < children.length; i++ ) {
            buf.push( children[ i ].getConvertedContent(engine) );
        }

        var content = buf.join( '' ).replace(/((?:\r\n|\n\r|\n|\r){2,})$/g, "\r\n");
        content = stringFormat(engine.options.blockTpl, this.name, content);

        return content;
    };

    

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
        context.targetOrMaster = null;
    };

    /**
     * 将target或master节点对象添加到语法分析环境中
     * 
     * @inner
     * @param {TargetCommand|MasterCommand} targetOrMaster target或master节点对象
     * @param {Object} context 语法分析环境对象
     */
    function addTargetOrMasterToContext( targetOrMaster, context ) {
        context.targetOrMaster = targetOrMaster;

        var engine = context.engine;
        var name = targetOrMaster.name;
        var scope = context.scope;

        if ( engine.targets[ name ] && scope === 'single') {
            switch ( engine.options.namingConflict ) {
                case 'override':
                    engine.targets[ name ] = targetOrMaster;
                    context.targets.push( name );
                case 'ignore':
                    break;
                default:
                    throw new Error( 'Target is exists: ' + name );
            }
        }
        else {
            if (scope !== 'single') {
                name += generateGUID(); 
            }
            engine.targets[ name ] = targetOrMaster;
            context.targets.push( name );
        }
    }

    /**
     * target节点open，解析开始
     * 
     * @param {Object} context 语法分析环境对象
     */
    TargetCommand.prototype.open = 

    /**
     * master节点open，解析开始
     * 
     * @param {Object} context 语法分析环境对象
     */
    MasterCommand.prototype.open = function ( context ) {
        autoCloseCommand( context );
        Command.prototype.open.call( this, context );
        addTargetOrMasterToContext( this, context );
    };


    /**
     * content节点open，解析开始
     * 
     * @param {Object} context 语法分析环境对象
     */
    ContentCommand.prototype.open = function ( context ) {
        autoCloseCommand( context, ContentCommand );
        Command.prototype.open.call( this, context );
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
        commandTypes[ name ] = Type;
        Type.prototype.type = name;
    }

    addCommandType( 'target', TargetCommand );
    addCommandType( 'master', MasterCommand );
    addCommandType( 'content', ContentCommand );
    addCommandType( 'contentplaceholder', ContentPlaceHolderCommand );
    

    function getConvertTpl(options) {
        var commandOpen = options.commandOpen;
        var commandClose = options.commandClose;

        var targetTpl = stringFormat(
            '{0} target: {1} {2}',
            commandOpen,
            '{0}',
            commandClose
        );
        var targetWithMasterTpl = stringFormat(
            '{0} target: {1} {2}',
            commandOpen,
            '{0}[master={1}]',
            commandClose
        );
        var blockTpl = stringFormat(
            '{0} block: {1} {3}{2}{0} /block {3}',
            commandOpen,
            '{0}',
            '{1}',
            commandClose
        );

        return {
            targetTpl: targetTpl,
            targetWithMasterTpl: targetWithMasterTpl,
            blockTpl: blockTpl
        };
    }

    /**
     * etpl引擎类
     * 
     * @constructor
     * @param {Object=} options 引擎参数
     * @param {string=} options.commandOpen 命令语法起始串
     * @param {string=} options.commandClose 命令语法结束串
     * @param {string=} options.defaultFilter 默认变量替换的filter
     * @param {boolean=} options.strip 是否清除命令标签前后的空白字符
     * @param {string=} options.namingConflict target或master名字冲突时的处理策略
     */
    function Engine( options ) {
        this.options = {
            commandOpen: '<!--',
            commandClose: '-->'
        };

        this.config( options );
        this.targets = {};
    }

    /**
     * 配置引擎参数，设置的参数将被合并到现有参数中
     * 
     * @param {Object} options 参数对象
     * @param {string=} options.commandOpen 命令语法起始串
     * @param {string=} options.commandClose 命令语法结束串
     * @param {string=} options.defaultFilter 默认变量替换的filter
     * @param {boolean=} options.strip 是否清除命令标签前后的空白字符
     * @param {string=} options.namingConflict target或master名字冲突时的处理策略
     */
    Engine.prototype.config =  function ( options ) {
        extend( this.options, options );

        extend(this.options, getConvertTpl(this.options));
    };

    /**
     * 解析模板并编译，返回第一个target编译后的renderer函数。
     * 该方法的存在为了兼容老模板引擎
     * 
     * @param {string} source 模板源代码
     * @return {function(Object):string}
     */
    Engine.prototype.parse = function ( source ) {
        if ( source ) {
            return parseSource( source, this );
        }

        return [];
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

        var stack = new Stack();
        var analyseContext = {
            engine: engine,
            targets: [],
            stack: stack,
            scope: engine.options.scope
        };

        // text节点内容缓冲区，用于合并多text
        var textBuf = [];

        /**
         * 将缓冲区中的text节点内容写入
         *
         * @inner
         */
        function flushTextBuf() {
            if ( textBuf.length > 0 ) {
                var text = textBuf.join( '' );
                var textNode = new TextNode( text, engine );
                textNode.beforeAdd( analyseContext );

                stack.top().addTextNode( textNode );
                textBuf = [];

                if ( engine.options.strip 
                    && analyseContext.current instanceof Command 
                ) {
                    textNode.value = text.replace( /^[\x20\t\r]*\n/, '' );
                }
                analyseContext.current = textNode;
            }
        }

        var NodeType;

        /**
         * 判断节点是否是NodeType类型的实例
         * 用于在stack中find提供filter
         * 
         * @inner
         * @param {Command} node 目标节点
         * @return {boolean}
         */
        function isInstanceofNodeType( node ) {
            return node instanceof NodeType;
        }

        parseTextBlock(
            source, commandOpen, commandClose, 0,

            function ( text ) { // <!--...-->内文本的处理函数
                var match = /^\s*(\/)?([a-z]+)\s*(:([\s\S]*))?$/.exec( text );

                // 符合command规则，并且存在相应的Command类，说明是合法有含义的Command
                // 否则，为不具有command含义的普通文本
                if ( match 
                    && ( NodeType = commandTypes[ match[2].toLowerCase() ] )
                    && typeof NodeType == 'function'
                ) {
                    // 先将缓冲区中的text节点内容写入
                    flushTextBuf(); 

                    var currentNode = analyseContext.current;
                    if ( engine.options.strip && currentNode instanceof TextNode ) {
                        currentNode.value = currentNode.value
                            .replace( /\r?\n[\x20\t]*$/, '\n' );
                    }

                    if ( match[1] ) {
                        currentNode = stack.find( isInstanceofNodeType );
                        currentNode && currentNode.close( analyseContext );
                    }
                    else {
                        currentNode = new NodeType( match[4], engine );
                        if ( typeof currentNode.beforeOpen == 'function' ) {
                            currentNode.beforeOpen( analyseContext );
                        }
                        currentNode.open( analyseContext );
                    }

                    analyseContext.current = currentNode;
                }
                else if ( !/^\s*\/\//.test( text ) ) {
                    // 如果不是模板注释，则作为普通文本，写入缓冲区
                    textBuf.push( commandOpen, text, commandClose );
                }

                NodeType = null;
            },

            function ( text ) { // <!--...-->外，普通文本的处理函数
                // 普通文本直接写入缓冲区
                textBuf.push( text );
            }
        );


        flushTextBuf(); // 将缓冲区中的text节点内容写入
        autoCloseCommand( analyseContext );

        return analyseContext.targets;
    }

    var etpl = new Engine();
    etpl.Engine = Engine;
    
    exports = module.exports = etpl;

})(this);

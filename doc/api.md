## API

ETpl 是一个多 Engine 实例的模板引擎。初始化时其自动创建一个默认的 Engine 实例，并将其暴露。大多数应用场景可直接使用默认的引擎实例。

```javascript
var etpl = require( 'etpl' );
```

你也可以通过 `new etpl.Engine` 初始化自己的引擎实例。 *不同的引擎实例可有效避免target命名冲突的问题。*

```javascript
var etpl = require( 'etpl' );
var etplEngine = new etpl.Engine();
```

引擎实例的初始化允许传入引擎参数。支持的引擎参数见下面的`config`方法。

```javascript
var etpl = require( 'etpl' );
var etplEngine = new etpl.Engine({
    commandOpen: '<%',
    commandClose: '%>'
});
```

下面是 Engine 的实例方法列表。

- [addCommand](#addCommand)
- [addFilter](#addFilter)
- [compile](#compile)
- [config](#config)
- [getRenderer](#getRenderer)
- [load](#load)
- [loadFromFile](#loadFromFile)
- [parse](#parse)
- [render](#render)



### addCommand

`{void} addCommand( {string}name, {Object}command )`

`常用` 自定义命令标签。

- `{string}`name - 命令标签名称
- `{Object}`command - 命令对象

command 参数是一个对象，包含一些在命令标签编译时各个阶段的处理方法。

- `init(context)` - 初始化
- `open(context)` - 标签起始
- `close(context)` - 标签闭合
- `getRendererBody():string` - 生成编译代码

```javascript
etpl.addCommand('dump', {
    init: function () {
        var match = this.value.match(/^\s*([a-z0-9_]+)\s*$/i);
        if (!match) {
            throw new Error('Invalid ' + this.type + ' syntax: ' + this.value);
        }

        this.name = match[1];
        this.cloneProps = ['name'];
    },

    open: function (context) {
        context.stack.top().addChild(this);
    },

    getRendererBody: function () {
        var util = etpl.util;
        var options = this.engine.options;
        return util.stringFormat(
            'console.log({0});',
            util.compileVariable(options.variableOpen + this.name + options.variableClose, this.engine)
        );
    }
});
```


### addFilter

`{void} addFilter( {string}name, {function({string}, {...*}):string}filter )`

`常用` 为默认引擎添加过滤器。过滤函数的第一个参数为过滤源字符串，其后的参数可由模板开发者传入。过滤函数必须返回string。

- `{string}`name - 过滤器名称
- `{Function}`filter - 过滤函数

```javascript
etpl.addFilter( 'markdown', function ( source, useExtra ) {
    // ......
} );
```

### compile

`{Function} compile( {string}source )`

`常用` 使用默认引擎编译模板。返回第一个target编译后的renderer函数。

- `{string}`source - 模板源代码

```javascript
var helloRenderer = etpl.compile( 'Hello ${name}!' );
helloRenderer( {name: 'ETPL'} ); // Hello ETPL!
```

### config

`{void} config( {Object}options )`

`常用` 对默认引擎进行配置，配置参数将合并到引擎现有的参数中。[查看配置参数](config.md)。

```javascript
etplEngine.config( {
    defaultFilter: ''
} );
```

### getRenderer

`{Function} getRenderer( {string}name )`

`常用` 从默认引擎中，根据target名称获取编译后的renderer函数。

- `{string}`name - target名称

```javascript
etpl.compile( '<!-- target: hello -->Hello ${name}!' );
var helloRenderer = etpl.getRenderer( 'hello' );
helloRenderer( {name: 'ETPL'} ); // Hello ETPL!
```


### load

`{Function} load( {string}name )`

`仅node环境` 加载并编译target文件

- `{string}`name - target名称

```javascript
var mainRenderer = etpl.load( 'main' );
mainRenderer( {name: 'ETPL'} );
```


### loadFromFile

`{Function} loadFromFile( {string}file )`

`仅node环境` 加载并编译模板文件

- `{string}`file - 模板文件路径

```javascript
var mainRenderer = etpl.loadFromFile( path.resolve(__dirname, 'main.etpl') );
mainRenderer( {name: 'ETPL'} );
```


### parse

同`compile`方法。该方法的存在是为了兼容老版本的模板引擎api，不建议使用。


### render

`{string} render( {string}name, {Object}data )`

使用默认引擎执行模板渲染，返回渲染后的字符串。

- `{string}`name - target名称
- `{Object}`data - 模板数据。可以是plain object，也可以是带有 **{string}get({string}name)** 方法的对象

```javascript
etpl.compile( '<!-- target: hello -->Hello ${name}!' );
etpl.render( 'hello', {name: 'ETPL'} ); // Hello ETPL!
```



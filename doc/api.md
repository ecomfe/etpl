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


### methods


#### {void} addFilter( {string}name, {function({string}, {...*}):string}filter )

为默认引擎添加过滤器。过滤函数的第一个参数为过滤源字符串，其后的参数可由模板开发者传入。过滤函数必须返回string。

- `{string}`name - 过滤器名称
- `{Function}`filter - 过滤函数

```javascript
etpl.addFilter( 'markdown', function ( source, useExtra ) {
    // ......
} );
```

#### {Function} compile( {string}source )

使用默认引擎编译模板。返回第一个target编译后的renderer函数。

- `{string}`source - 模板源代码

```javascript
var helloRenderer = etpl.compile( 'Hello ${name}!' );
helloRenderer( {name: 'ETPL'} ); // Hello ETPL!
```

#### {void} config( {Object}options )

对默认引擎进行配置，配置参数将合并到引擎现有的参数中。[查看配置参数](config.md)。

```javascript
etplEngine.config( {
    defaultFilter: ''
} );
```

#### {Function} getRenderer( {string}name )

从默认引擎中，根据target名称获取编译后的renderer函数。

- `{string}`name - target名称

```javascript
etpl.compile( '<!-- target: hello -->Hello ${name}!' );
var helloRenderer = etpl.getRenderer( 'hello' );
helloRenderer( {name: 'ETPL'} ); // Hello ETPL!
```

#### {Function} parse( {string}source )

同`compile`方法。该方法的存在是为了兼容老版本的模板引擎api，不建议使用。



#### {string} render( {string}name, {Object}data )

使用默认引擎执行模板渲染，返回渲染后的字符串。

- `{string}`name - target名称
- `{Object}`data - 模板数据。可以是plain object，也可以是带有 **{string}get({string}name)** 方法的对象

```javascript
etpl.compile( '<!-- target: hello -->Hello ${name}!' );
etpl.render( 'hello', {name: 'ETPL'} ); // Hello ETPL!
```



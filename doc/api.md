＃ API

该文档描述了ETPL支持的API。

## classes


### Engine

#### 初始化

下面的代码可以初始化一个新的引擎实例。

```javascript
var etpl = require( 'etpl' );
var etplEngine = new etpl.Engine();
```

#### {Function} compile( {string}source )

编译模板。返回第一个target编译后的renderer函数。

- `{string}`source - 模板源代码


#### {string} get( {string}name )

根据target名称获取模板源代码。

- `{string}`name - target名称



#### {Function} getRenderer( {string}name )

根据target名称获取编译后的renderer函数。

- `{string}`name - target名称



#### {string} render( {string}name, {Object}data )

执行模板渲染，返回渲染后的字符串。

- `{string}`name - target名称
- `{Object}`data - 模板数据。可以是plain object，也可以是带有 **{string}get({string}name)** 方法的对象




## methods

ETPL初始化时自动创建一个默认的引擎实例，并在exports中暴露相应的方法。大多数应用场景可直接使用默认的引擎实例。


### {Function} compile( {string}source )

使用默认引擎编译模板。返回第一个target编译后的renderer函数。

- `{string}`source - 模板源代码


### {string} get( {string}name )

从默认引擎中，根据target名称获取模板源代码。

- `{string}`name - target名称



### {Function} getRenderer( {string}name )

从默认引擎中，根据target名称获取编译后的renderer函数。

- `{string}`name - target名称



### {void} merge( {HTMLElement}element, {string}name, {Object}data )

使用默认引擎执行模板渲染，并将渲染后的字符串作为innerHTML填充到HTML元素中。该方法的存在是为了兼容老版本的模板引擎api，不建议使用。

- `{HTMLElement}`element - 渲染字符串填充的HTML元素
- `{string}`name - target名称
- `{Object}`data - 模板数据。可以是plain object，也可以是带有 **{string}get({string}name)** 方法的对象



### {Function} parse( {string}source )

同`compile`方法。该方法的存在是为了兼容老版本的模板引擎api，不建议使用。



### {string} render( {string}name, {Object}data )

使用默认引擎执行模板渲染，返回渲染后的字符串。

- `{string}`name - target名称
- `{Object}`data - 模板数据。可以是plain object，也可以是带有 **{string}get({string}name)** 方法的对象


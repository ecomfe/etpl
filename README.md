# ETPL (Enterprise Template)

ETPL是一个简单的模板引擎，适用于WEB前端应用中视图的生成。ETPL的语法特点是采用HTML注释的形式，模板在编写中不会丧失编辑器的HTML高亮和自动完成功能。

- [了解ETPL的语法](#Syntax)
- [浏览ETPL的API](#API)

## API

ETPL可以在`CommonJS/AMD`的模块定义环境中使用，也可以直接在页面下通过`<script src=`的方式引用。`CommonJS/AMD`环境下需要通过如下代码得到ETPL的模块。

```javascript
var etpl = require( 'etpl' );
```

### methods

ETPL初始化时自动创建一个默认的引擎实例，并将其暴露。大多数应用场景可直接使用默认的引擎实例。

```javascript
var etpl = require( 'etpl' );
```

#### {Function} compile( {string}source )

使用默认引擎编译模板。返回第一个target编译后的renderer函数。

- `{string}`source - 模板源代码

```javascript
var helloRenderer = etpl.compile( 'Hello ${name}!' );
helloRenderer( {name: 'ETPL'} ); // Hello ETPL!
```



#### {string} get( {string}name )

从默认引擎中，根据target名称获取模板内容。

- `{string}`name - target名称

```javascript
etpl.compile( '<!-- target: hello -->Hello ${name}!' );
etpl.get( 'hello' ); // Hello ${name}!
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

### classes


#### Engine

##### 初始化

下面的代码可以初始化一个新的引擎实例。

```javascript
var etpl = require( 'etpl' );
var etplEngine = new etpl.Engine();
```

*不同的引擎实例可有效避免target命名冲突的问题。*


##### {Function} compile( {string}source )

编译模板。返回第一个target编译后的renderer函数。

- `{string}`source - 模板源代码

```javascript
var helloRenderer = etplEngine.compile( 'Hello ${name}!' );
helloRenderer( {name: 'ETPL'} ); // Hello ETPL!
```


##### {string} get( {string}name )

根据target名称获取模板内容。

- `{string}`name - target名称


```javascript
etplEngine.compile( '<!-- target: hello -->Hello ${name}!' );
etplEngine.get( 'hello' ); // Hello ${name}!
```


##### {Function} getRenderer( {string}name )

根据target名称获取编译后的renderer函数。

- `{string}`name - target名称

```javascript
etplEngine.compile( '<!-- target: hello -->Hello ${name}!' );
var helloRenderer = etplEngine.getRenderer( 'hello' );
helloRenderer( {name: 'ETPL'} ); // Hello ETPL!
```


##### {string} render( {string}name, {Object}data )

执行模板渲染，返回渲染后的字符串。

- `{string}`name - target名称
- `{Object}`data - 模板数据。可以是plain object，也可以是带有 **{string}get({string}name)** 方法的对象

```javascript
etplEngine.compile( '<!-- target: hello -->Hello ${name}!' );
etplEngine.render( 'hello', {name: 'ETPL'} ); // Hello ETPL!
```


## Compatibility

ETPL的前身是[ER框架](https://github.com/ecomfe/er)自带的简易模板引擎，基本与其前身完全兼容。但由于性能、体积等考虑因素，存在以下一些不兼容的地方。

### merge

出于代码体积和使用频度的考虑，ETPL删除了`merge`API。如果想要该API，请在自己的应用中加入如下代码：

```javascript
/**
 * 执行模板渲染，并将渲染后的字符串作为innerHTML填充到HTML元素中。
 * 兼容老版本的模板引擎api
 * 
 * @param {HTMLElement} element 渲染字符串填充的HTML元素
 * @param {string} name target名称
 * @param {Object=} data 模板数据
 */
etpl.merge = function ( element, name, data ) {
    if ( element ) {
        element.innerHTML = this.render( name, data );
    }
};
```

### 命令名称大小写

在[ER框架](https://github.com/ecomfe/er)自带的简易模板引擎中，命令的声明是大小写不敏感的，以下几种方式均可以声明一个contentplacehloder：

```html
<!-- contentplaceholder: name -->
<!-- ContentPlaceHolder: name -->
<!-- ContentPlaceholder: name -->
```

在ETPL中，命令只允许使用小写字母。上面声明一个contentplacehloder的例子，只允许使用如下方式：

```html
<!-- contentplaceholder: name -->
```

### 变量的属性访问

在[ER框架](https://github.com/ecomfe/er)自带的简易模板引擎中，允许使用`[]`的形式进行属性访问：

```html
${person['name']}
${person.name}
```

在ETPL中，只允许通过`.`进行属性访问：

```html
${person.name}
```

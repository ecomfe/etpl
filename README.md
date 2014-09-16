# ETPL (Enterprise Template)

[![Build Status](https://travis-ci.org/ecomfe/etpl.svg?branch=master)](https://travis-ci.org/ecomfe/etpl)

ETPL是一个强复用、灵活、高性能的JavaScript模板引擎，适用于浏览器端或Node环境中视图的生成。


## Start

ETpl可以在`CommonJS/AMD`的模块定义环境中使用，也能直接在页面下通过`script`标签引用。


### 浏览器环境

直接通过script标签引用，你可以获得一个全局的`etpl`变量

```html
<script src="etpl.js"></script>
```

在AMD环境的模块定义时，你可以通过`同步require`获得ETpl模块

```javascript
define(function (require) {
    var etpl = require('etpl');
});
```

在AMD环境，你也可以通过`异步require`获得ETpl模块

```javascript
require([ 'etpl' ], function (etpl) {
});
```

*在AMD环境下，请确保你的require.config配置能够让Loader找到ETpl模块*

### Node.JS环境

你可以通过`npm`来安装ETpl

```
$ npm install etpl
```

安装完成后，你就可以通过`require`获得一个ETpl模块，正常地使用它

```javascript
var etpl = require('etpl');
```

### 使用

使用ETPL模块，对模板源代码进行编译，会能得到编译后的function

```javascript
var render = etpl.compile('Hello ${name}!');
```

执行这个function，传入数据对象，就能得到模板执行的结果了

```javascript
var text = render({ name: 'etpl' });
```

查看更多例子，或者对模板渲染结果有疑虑，就去ETPL的[example](http://ecomfe.github.io/etpl/example.html)看看吧。


## Documents

通过文档，你可以更详细地了解ETpl的语法格式、使用方法、API等内容。

- [模板语法](doc/syntax.md)
- [API](doc/api.md)
- [配置参数](doc/config.md)


## Compatibility

### ETpl3的新语法

我们认为，当前流行的通过`block`来表达模板继承中的变化，是更好的表达方式。所以在ETpl3中，我们优化了母版的语法，删除了`master`、`contentplacehoder`、`content`标签，引入了`block`标签。

对于ETpl2的使用者，我们提供一个[etpl2to3](https://github.com/ecomfe/etpl2to3)工具，能够帮助你平滑地将ETpl2的模板翻译成ETpl3。


### get

ETpl2中，为了前向兼容，Engine的`get`方法可以根据target名称获取模板内容。

ETpl3不再支持该方法，所有的模板都通过render来使用：

- 直接使用engine实例的render方法 
- 调用renderer function

如果仍需要该功能，说明你正在维护一个遗留系统，并且没有很频繁的升级需求。请继续使用ETpl2。


### merge

ETpl的前身是[ER框架](https://github.com/ecomfe/er)自带的简易模板引擎，其基本与前身保持兼容。但出于代码体积和使用频度的考虑，ETpl删除了`merge`API。如果想要该API，请在自己的应用中加入如下代码：

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

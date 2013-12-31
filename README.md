# ETPL (Enterprise Template)

ETPL是一个灵活、具有强大复用能力的高性能的模板引擎，适用于WEB前端应用中视图的生成，特别是SPA(Single Page APP)类型的应用。

- [开始](#start)
- [了解ETPL的语法](#syntax)
    - [基础](#基础)
        - [语法形式](#语法形式)
        - [自动结束](#自动结束)
        - [target](#target)
        - [变量声明](#变量声明)
        - [变量替换](#变量替换)
        - [内容块过滤](#内容块过滤)
    - [模板复用](#模板复用)
        - [import](#import)
        - [母版](#母版)
        - [use](#use)
    - [分支与循环](#分支与循环)
        - [if](#if)
        - [for](#for)
- [浏览ETPL的API](#api)
    - [methods](#methods)
    - [classes](#classes)
- [与ER中模板引擎的兼容性](#compatibility)

## Start

ETPL可以在`CommonJS/AMD`的模块定义环境中使用，也可以直接在页面下通过`<script src=`的方式引用。`CommonJS/AMD`环境下需要通过如下代码得到ETPL的模块。

```javascript
var etpl = require( 'etpl' );
```

得到ETPL模块对象后，首先对模板源代码进行编译，就能够得到模板编译后的`function`。

```javascript
var render = etpl.compile( 'Hello ${name}!' );
```

然后执行这个`function`，传入数据对象，就能得到模板执行的结果了。

```javascript
var text = render( {name: 'etpl'} );
```

编写模板和数据前，如果对执行结果有疑虑，就去ETPL的[homepage](http://ecomfe.github.io/etpl/)试试看吧。


## Syntax

### 基础

#### 语法形式

ETPL的指令标签默认为HTML注释的形式，在指令标签内允许声明 `指令起始`、`指令结束`和`注释`。

`指令起始`的语法形式为： *<!-- command-name: command-value -->*。其中， *command-value* 的具体语法形式详情请参见各指令相关章节。

```html
<!-- target: targetName -->
<!-- if: ${number} > 0 -->
<!-- for: ${persons} as ${person}, ${index} -->
```

`指令结束`的语法形式为： *<!-- /command-name -->*。

```html
<!-- /if -->
<!-- /for -->
<!-- /target -->
```

`注释`的语法形式为： *<!-- //message -->*，注释指令在render时将不输出。

```html
<!-- // just add some message -->
```

如果不期望使用HTML注释形式的指令标签，可以通过config API可以配置指令标签的形式：

```javascript
etpl.config({
    commandOpen: '<%',
    commandClose: '%>'
});

/* 
配置指令标签的形式为“<% ... %>”，然后指令标签可以像下面一样声明:
<% if: ${number} > 0 %>
greater than zero
<% /if %>
*/
```

#### 自动结束

为了减少开发者的工作量，部分指令标签支持`自动结束`，模板开发者无需手工编写`指令结束`。比如：当遇见target指令起始时，ETPL自动认为上一个target已经结束。

具体指令的`自动结束`支持，请参考相应指令相关章节。


#### target

`target`是ETPL的基本单元，其含义是 **一个模版片段** 。`target`可用于render，也可用于被其他`target`所import或use。

如果仅仅编写的是一个模板片段，可以省略`target`的声明。这样的编写方式与其他模板引擎类似，但模板片段将不可复用（不可被import或use，不可指定母版）。

##### 语法

target的语法形式为：

    target: target-name
    target: target-name(master=master-name)

target声明可以为其指定相应的母版。母版功能请参考模板复用章节。


##### 自动结束

target支持自动结束，当遇见 *target* 或 *master* 时自动结束。


##### 示例

```html
<!-- target: hello -->
Hello <strong>ETPL</strong>!

<!-- target: bye -->
Bye <strong>ETPL</strong>!
```

#### 变量声明

通过`var`指令可以在模板内部声明一个变量。声明的变量在整个`target`内有效。

##### 语法

var的语法形式为：

    var: var-name=expression

`expression`中可以使用静态或动态数据。

##### 示例

```html
<!-- var: age = 18 -->
<!-- var: age = ${person.age} -->
<!-- var: name = 'etpl' -->
```

##### 自动结束

var无需编写`指令结束`，其将在`指令起始`后立即自动结束。


#### 变量替换

绝大多数模板引擎都支持变量替换功能。ETPL变量替换的语法为：

    ${variable-name}
    ${variable-name|filter-name}
    ${variable-name|filter-name(arguments)}
    ${variable-name|filter1|filter2(arguments)|filter3|...}

variable-name支持`.`形式的property access。

编写模板时可以指定filter，默认使用html filter进行HTML转义。如果想要保留变量的原形式，需要手工指定使用名称为raw的filter，或者通过config API配置引擎的defaultFilter参数。

    ${myVariable|raw}

```javascript
etpl.config({ 
    defaultFilter: ''
});
```

ETPL默认支持3种filters，可以通过引擎的`addFilter`方法自定义扩展filter。

- html: html转义
- url: url转义
- raw: 不进行任何转义


变量替换支持多filter处理。filter之间以类似管道的方式，前一个filter的输出做为后一个filter的输入，向后传递。

```html
${myVariable|html|url}
```

filter支持参数传递，参数可以使用动态数据。

```html
<!-- // 假设存在扩展filter: comma -->
${myVariable|comma(3)}
${myVariable|comma(${commaLength})}
${myVariable|comma(${commaLength}+1)}
```

在变量替换中，引擎会默认将数据toString后传递给filter，以保证filter输入输出的类型一致性。如果filter期望接受的是原始数据，模板开发者需要通过前缀的`*`指定。

```html
<!-- // 假设存在扩展filter: dateFormat -->
${*myDate|dateFormat('yyyy-MM-dd')}
```

#### 内容块过滤

除了在变量替换中可以使用filter进行处理，ETPL还可以通过`filter`指令，使用指定的filter对一个模板内容块进行过滤处理。

##### 语法

filter的语法形式为：

    filter: filter-name
    filter: filter-name(arguments)

##### 示例

下面的例子假定使用者实现了一个markdown的filter

```html
<!-- filter: markdown(${useExtra}, true) -->
## markdown document

This is the content, also I can use `${variables}`
<!-- /filter -->
```

##### 自动结束

filter指令不支持自动结束，必须手工编写`指令结束`。

```html
<!-- /filter -->
```

### 模板复用

ETPL支持多种形式的模板复用方式，帮助模板开发者减少模板编写的重复劳动和维护成本。


#### import

通过import指令，可以在当前位置插入指定target的源码。

##### 语法

import的语法形式为：

    import: target-name


##### 示例

```html
<!-- target: hello -->
Hello <strong>${name}</strong>!

<!-- target: main -->
<div class="main"><!-- import: hello --></div>
```

##### 自动结束

import无需编写`指令结束`，其将在`指令起始`后立即自动结束。


#### 母版

通过`master`指令可以声明一个母版，母版中通过`contentplaceholder`指令声明可被替换的部分。

`target`声明时通过 **master=master-name** 指定一个母版，就可以继承于这个母版的片段，并且通过`content`指令，替换母版中`contentplaceholder`指令声明部分的内容。指定母版的target中只允许包含`content`指令声明的片段。

母版功能支持多层母版，`master`声明时也可以通过 **master=master-name** 指定一个母版。母板中的`contentplaceholder`不会再传递下去，即`contentplaceholder`只在一层有效。

##### 语法

master的语法形式为：

    master: master-name
    master: master-name(master=master-name)

contentplaceholder的语法形式为：

    contentplaceholder: content-name

content的语法形式为：

    content: content-name


##### 示例

```html
<!-- master: myMaster -->
<div class="title"><!-- contentplaceholder: title -->title<!-- /contentplaceholder --></div>
<div class="main"><!-- contentplaceholder: main --></div>

<!-- master: myMaster-has-sidebar(master=myMaster) -->
<!-- content: title -->
title for has sidebar
<!-- content: main -->
<div class="sidebar"><!-- contentplaceholder: sidebar --></div>
<div class="article"><!-- contentplaceholder: article --></div>

<!-- target: myTarget(master=myMaster) -->
<!-- content: title -->
Building WebKit from Xcode
<!-- content: main -->
<p>To build from within Xcode, you can use the WebKit workspace. </p>

<!-- target: myTarget-has-sidebar(master=myMaster-has-sidebar) -->
<!-- content: sidebar -->
<ul class="navigator">...</ul>
<!-- content: article -->
<p>To build from within Xcode, you can use the WebKit workspace. </p>
```

##### 自动结束

master支持自动结束，当遇见 *target* 或 *master* 时自动结束。

contentplaceholder支持自动结束，当遇见 *contentplaceholder* 或 *target* 或 *master* 时，在`指令标签起始`后自动结束。

content支持自动结束，当遇见 *content* 或 *target* 或 *master* 时自动结束。


#### use

通过`use`指令，可以调用指定`target`，在当前位置插入其render后的结果。允许使用静态或动态数据指定数据项。

##### 语法

use的语法形式为：

    use: target-name
    use: target-name(data-name=expression, data-name=expression)


##### 示例

```html
<!-- target: info -->
name: ${name}
<!-- if: ${email} -->
email: ${email}
<!-- /if -->

<!-- target: main -->
<div class="main"><!-- use: info(name=${person.name}, email=${person.email}) --></div>
```

##### 自动结束

use无需编写`指令结束`，其将在`指令起始`后立即自动结束。

### 分支与循环

#### if

ETPL提供了分支的支持，相关指令有`if`、`elif`、`else`。

##### 语法

if的语法形式为：

    if: conditional-expression

elif的语法形式为：

    elif: conditional-expression

else的语法形式为：

    else

conditional-expression中可以使用动态数据，通过`${variable}`的形式，可以使用模板render的data。`${variable}`支持`.`的property accessor。

##### 自动结束

if指令不支持自动结束，必须手工编写指令结束`<!-- /if -->`。

##### 示例

```html
<!-- if: ${number} > 0 -->
larger than zero
<!-- elif: ${number} == 0 -->
zero
<!-- else -->
invalid
<!-- /if -->
```

##### 自动结束

if指令不支持自动结束，必须手工编写`指令结束`。

```html
<!-- /if -->
```

#### for

通过for指令的支持，可以实现对Array和Object的遍历。Array为正序遍历，Object为不保证顺序的forin。

##### 语法

for的语法形式为：

    for: ${variable} as ${item-variable}
    for: ${variable} as ${item-variable}, ${index-variable}
    for: ${variable} as ${item-variable}, ${key-variable}

其中，`${variable}`为想要遍历的对象，支持`.`形式的property access。在遍历过程中，声明的`${item-variable}`和`${index-variable}`，分别代表数据项和索引（遍历Object时为键名）。

##### 示例

```html
<ul>
<!-- for: ${persons} as ${person}, ${index} -->
<li>${index}: ${person.name}
<!-- /for -->
</ul>
```

##### 自动结束

for指令不支持自动结束，必须手工编写`指令结束`。

```html
<!-- /for -->
```

## API

### methods

ETPL初始化时自动创建一个默认的引擎实例，并将其暴露。大多数应用场景可直接使用默认的引擎实例。

```javascript
var etpl = require( 'etpl' );
```

##### {void} addFilter( {string}name, {function({string}, {...*}):string}filter )

为默认引擎添加过滤器。过滤函数的第一个参数为过滤源字符串，其后的参数可由模板开发者传入。过滤函数必须返回string。

- `{string}`name - 过滤器名称
- `{Function}`filter - 过滤函数

```javascript
etpl.addFilter( 'markdown', function ( source, useExtra ) {
    // ......
} );
```

##### {Function} compile( {string}source )

使用默认引擎编译模板。返回第一个target编译后的renderer函数。

- `{string}`source - 模板源代码

```javascript
var helloRenderer = etpl.compile( 'Hello ${name}!' );
helloRenderer( {name: 'ETPL'} ); // Hello ETPL!
```

##### {void} config( {Object}options )

对默认引擎进行配置，配置参数将合并到引擎现有的参数中。

- `{Object}`options - 配置参数对象
- `{string}`options.commandOpen - 命令语法起始串，默认值为 *<!--*
- `{string}`options.commandClose - 命令语法结束串，默认值为 *-->*
- `{string}`options.defaultFilter - 默认变量替换的filter，默认值为 *html*

```javascript
etplEngine.config( {
    defaultFilter: ''
} );
```

##### {string} get( {string}name )

从默认引擎中，根据target名称获取模板内容。

- `{string}`name - target名称

```javascript
etpl.compile( '<!-- target: hello -->Hello ${name}!' );
etpl.get( 'hello' ); // Hello ${name}!
```



##### {Function} getRenderer( {string}name )

从默认引擎中，根据target名称获取编译后的renderer函数。

- `{string}`name - target名称

```javascript
etpl.compile( '<!-- target: hello -->Hello ${name}!' );
var helloRenderer = etpl.getRenderer( 'hello' );
helloRenderer( {name: 'ETPL'} ); // Hello ETPL!
```

##### {Function} parse( {string}source )

同`compile`方法。该方法的存在是为了兼容老版本的模板引擎api，不建议使用。



##### {string} render( {string}name, {Object}data )

使用默认引擎执行模板渲染，返回渲染后的字符串。

- `{string}`name - target名称
- `{Object}`data - 模板数据。可以是plain object，也可以是带有 **{string}get({string}name)** 方法的对象

```javascript
etpl.compile( '<!-- target: hello -->Hello ${name}!' );
etpl.render( 'hello', {name: 'ETPL'} ); // Hello ETPL!
```

### classes


#### Engine

*不同的引擎实例可有效避免target命名冲突的问题。*

##### 初始化

下面的代码可以初始化一个新的引擎实例。

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

##### {void} addFilter( {string}name, {function({string}, {...*}):string}filter )

添加过滤器。过滤函数的第一个参数为过滤源字符串，其后的参数可由模板开发者传入。过滤函数必须返回string。

- `{string}`name - 过滤器名称
- `{Function}`filter - 过滤函数

```javascript
etplEngine.addFilter( 'markdown', function ( source, useExtra ) {
    // ......
} );
```

##### {Function} compile( {string}source )

编译模板。返回第一个target编译后的renderer函数。

- `{string}`source - 模板源代码

```javascript
var helloRenderer = etplEngine.compile( 'Hello ${name}!' );
helloRenderer( {name: 'ETPL'} ); // Hello ETPL!
```

##### {void} config( {Object}options )

对引擎进行配置，配置参数将合并到引擎现有的参数中。

- `{Object}`options - 配置参数对象
- `{string}`options.commandOpen - 命令语法起始串，默认值为 *<!--*
- `{string}`options.commandClose - 命令语法结束串，默认值为 *-->*
- `{string}`options.defaultFilter - 默认变量替换的filter，默认值为 *html*

```javascript
etplEngine.config( {
    defaultFilter: ''
} );
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

ETPL的前身是[ER框架](https://github.com/ecomfe/er)自带的简易模板引擎，其基本与前身保持兼容。但由于一些考虑因素，存在以下一些不兼容的地方。

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

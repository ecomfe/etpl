# Syntax

通过该文档，你可以了解ETPL的模板语法。

## 基础

### 语法形式

ETPL的指令标签默认为HTML注释的形式，包括 `指令标签起始` 和 `指令标签结束`。

`指令标签起始`的语法形式为： *<!-- command-name: command-value -->*。其中， *command-value* 的具体语法形式详情请参见各指令相关章节。

```html
<!-- target: targetName -->
<!-- if: ${number} > 0 -->
<!-- for: ${persons} as ${person}, ${index} -->
```

`指令标签结束`的语法形式为： *<!-- /command-name -->*。

```html
<!-- /if -->
<!-- /for -->
<!-- /target -->
```

### 自动结束

部分指令标签支持`自动结束`，模板编写者无需编写`指令标签结束`。比如：当遇见target指令起始时，ETPL自动认为上一个target已经结束。

具体指令的`自动结束`支持，请参考相应指令相关章节。


### target

target是ETPL规定的基本单元，其含义是 **一个模版片段** 。target可用于render，也可用于被其他target所import。

#### 语法

target的语法形式为：

    target: target-name
    target: target-name(master=master-name)

target声明时可以为其指定相应的母版。


#### 自动结束

target支持自动结束，当遇见 *target* 或 *master* 时自动结束。


#### 示例

```html
<!-- target: hello -->
Hello <strong>ETPL</strong>!

<!-- target: bye -->
Bye <strong>ETPL</strong>!
```

### 变量替换

绝大多数模板引擎都支持变量替换功能。ETPL变量替换的语法为：

    ${variable-name}
    ${variable-name|filter-name}

编写模板时可以手工指定变量替换的filter。ETPL在变量替换时，默认使用html filter进行HTML转义。如果想要保留变量的原形式，需要手工指定使用名称为raw的filter。

    ${myVariable|raw}


## 模板复用

ETPL支持多种形式的模板复用方式，帮助模板开发者减少模板编写的重复劳动和维护成本。


### import

通过import指令，可以在当前位置插入指定target的源码。

#### 语法

import的语法形式为：

    import: target-name

#### 自动结束

import无需编写`指令标签结束`，所以其将在`指令标签起始`后立即自动结束。

#### 示例

```html
<!-- target: hello -->
Hello <strong>${name}</strong>!

<!-- target: main -->
<div class="main"><!-- import: hello --></div>
```


### master

通过`master`指令可以声明一个母版，母版中通过`contentplaceholder`指令声明可被替换的部分。

`target`声明时通过 **master=master-name** 指定一个母版，就可以继承于这个母版的片段，并且通过`content`指令，替换母版中`contentplaceholder`指令声明部分的内容。指定母版的target中只允许包含`content`指令声明的片段。

#### 语法

master的语法形式为：

    master: master-name

contentplaceholder的语法形式为：

    contentplaceholder: content-name

content的语法形式为：

    content: content-name


#### 自动结束

master支持自动结束，当遇见 *target* 或 *master* 时自动结束。

contentplaceholder支持自动结束，当遇见 *contentplaceholder* 或 *target* 或 *master* 时，在`指令标签起始`后自动结束。

content支持自动结束，当遇见 *content* 或 *target* 或 *master* 时自动结束。

#### 示例

```html
<!-- master: myMaster -->
<div class="title"><!-- contentplaceholder: title -->title<!-- /contentplaceholder --></div>
<div class="main"><!-- contentplaceholder: main --></div>

<!-- target: myTarget(master=myMaster) -->
<!-- content: title -->
Building WebKit from Xcode

<!-- content: main -->
<p>To build from within Xcode, you can use the WebKit workspace. Ensure that the Products and Intermediates locations for the workspace match those used by build-webkit by choosing File > Workspace Settings and clicking the Advanced button, selecting Custom, Relative to Workspace, and entering WebKitBuild both for Products and for Intermediates. Note that if you have specified a custom build location in Xcode preferences, then you don’t need to do this.</p>
```

## 分支与循环

### if

ETPL提供了分支的支持，相关指令有`if`、`elif`、`else`。分支语句必须位于target或master内。

#### 语法

if的语法形式为：

    if: conditional-expression

elif的语法形式为：

    elif: conditional-expression

else的语法形式为：

    else

conditional-expression中，通过`${variable}`的形式，可以使用模板render的data。`${variable}`支持`.`和`[]`形式的property accessor。

#### 自动结束

if指令不支持自动结束，必须手工编写`<!-- /if -->`。

#### 示例

```html
<!-- if: ${number} > 0 -->
larger than zero
<!-- elif: ${number} == 0 -->
zero
<!-- else -->
invalid
<!-- /if -->
```

### for

通过for指令的支持，可以实现对数组的遍历。

#### 语法

for的语法形式为：

    for: ${variable} as ${item-variable}, ${index-variable}

其中，`${variable}`为想要遍历的数组对象。在遍历过程中，声明的`${item-variable}`和`${index-variable}`，分别代表数组项数据和数组项索引。

#### 自动结束

for指令不支持自动结束，必须手工编写`<!-- /for -->`。

#### 示例

```html
<ul>
<!-- for: ${persons} as ${person}, ${index} -->
<li>${index}: ${person.name}
<!-- /for -->
</ul>
```


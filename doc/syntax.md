# API

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

支持自动结束的指令有：

- `target` － 遇见 *target* 或 *master* 时自动结束。


### target

target是ETPL规定的基本单元，其含义是 **一个模版片段** 。target可用于render，也可用于被其他target所import。

#### 语法

target的 *command-value* 语法形式为：

    target: target-name
    target: target-name(master=master-name)



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

## 模板复用

### import

### master

## 分支与循环

### if

### for
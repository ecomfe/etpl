# API

通过该文档，你可以了解ETPL的模板语法。

## 基础

### 语法形式

ETPL的指令标签默认为HTML注释的形式，包括 `指令标签起始` 和 `指令标签结束`。

`指令标签起始`的语法形式为： *<!-- command-name: command-value -->*。

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

### 变量替换

## 模板复用

### import

### master

## 分支与循环

### if

### for
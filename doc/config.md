## Config

- [commandOpen](#commandopen)
- [commandClose](#commandclose)
- [commandSyntax](#commandsyntax)
- [variableOpen](#variableopen)
- [variableClose](#variableclose)
- [defaultFilter](#defaultfilter)
- [strip](#strip)
- [namingConflict](#namingconflict)
- [missTarget](#misstarget)
- [dir](#dir)
- [extname](#extname)
- [encoding](#encoding)


通过engine初始化时构造函数参数，或者engine实例的config方法，可以配置ETpl引擎的参数。

```javascript
etplEngine.config( {
    strip: true
} );
```

下面是ETpl支持的参数列表。


### commandOpen 

`string`

命令语法起始串，默认值为 *<!--*


### commandClose

`string`

命令语法结束串，默认值为 *-->*


### commandSyntax

`RegExp`

命令语法格式。设置该参数时，正则需要包含3个matches：

1. 命令结束标记
2. 命令名称
3. 命令值


### variableOpen 

`string`，默认值为 *${*

变量语法起始串


### variableClose 

`string`

变量语法结束串，默认值为 *}*


### defaultFilter

`string`

默认变量替换的filter，默认值为 *html*


### strip

`boolean`

是否清除命令标签前后的空白字符，默认值为 *false*


### namingConflict

`string`

target名字冲突时的处理策略，值可以是:

- `error`: 抛出错误。此项为默认值
- `ignore`: 保留现有目标，忽略新目标
- `override`: 覆盖现有目标

### missTarget

`string`

target不存在时的处理策略，值可以是:

- `error`: 抛出错误
- `ignore`: 静默处理，无错误。此项为默认值


### dir

`string` `仅node环境有效`

模板文件目录，用于加载target文件时的路径查找，默认值为 *process.pwd()*


### extname

`string` `仅node环境有效`

模板文件后缀名，默认值为 *.etpl*


### encoding

`string` `仅node环境有效`

模板文件编码，默认值为 *UTF-8*



    var engine = require('./engine');
    var fs = require('fs');
    var path = require('path');  
    var encodeing = 'utf-8';

    // 常用配置项，会被config文件中的设置覆盖
    var config = {
        commandOpen: '<!--',
        commandClose: '-->',
        scope: 'single'
    };

    /**
     * 从命令行获取参数
     * 
     * @inner
     * @return {Object} 返回目标对象
     */
    function getArgs() {
        var args = arguments.length > 0 
                    ? arguments
                    : process.argv.slice(2);
        var result = {
            input: args[0],
            save: 'new',
            output: '',
            extName: '.tpl.html'
        };

        for (var i = 1; i < args.length; i++) {
            var arg = args[i];
            if (arg.indexOf('--') === 0) {
                var argName = arg.substr(2);
                var argValue = args[ i + 1 ];
                result[ argName ] = argValue; 
                i = i + 1;
            }
        }

        if (result.output) {
            result.save = 'new';
        }

        return result;
    }

    /**
     * 对象属性拷贝
     * 
     * @inner
     * @param {Object} target 目标对象
     * @param {Object} source 源对象
     * @return {Object} 返回目标对象
     */
    function extend( target, source ) {
        for ( var key in source ) {
            if ( source.hasOwnProperty( key ) ) {
                target[ key ] = source[ key ];
            }
        }

        return target;
    }

    /**
     * 字符串格式化
     * 
     * @inner
     * @param {string} source 目标模版字符串
     * @param {...string} replacements 字符串替换项集合
     * @return {string}
     */
    function stringFormat( source ) {
        var args = arguments;
        return source.replace( 
            /\{([0-9]+)\}/g,
            function ( match, index ) {
                return args[ index - 0 + 1 ];
            } );
    }

    /**
     * 清除字符串前后的空字符
     * 
     * @inner
     * @param {string} source 输入字符串
     * @return {string}
     */
    function trim(source){
        return source.replace(/(^\s*)|(\s*$)/g, "");
    }


    /**
     * 判断文件是否是模版文件
     * 
     * @inner
     * @param {Object} reg 模版文件名的正则表达式
     * @param {string} fileName 文件名
     * @return {bool}
     */
    function isTplFile(reg, fileName) {
        fileName = fileName.replace(/\\/g, '/');
        return reg.test(fileName);
    }

    /**
     * 遍历文件夹
     * 
     * @inner
     * @param {Object} path 文件路径
     * @param {Object} reg 模版文件名的正则表达式
     * @param {Function} handler 处理函数
     */
    function walk(path, reg, handler, options) {
        var fileStat = fs.statSync(path);
        
        if (fileStat.isDirectory()) {
            fs.readdir(path, function(err, files) {  
                if (err) {  
                    console.log('read dir error');  
                } else {  
                    files.forEach(function(item) {  
                        var tmpPath = path + '/' + item;  
                        fs.stat(tmpPath, function(err1, stats) {  
                            if (err1) {  
                                console.log('stat error');  
                            } else {  
                                if (stats.isDirectory()) {  
                                    walk(tmpPath, reg, handler, options);  
                                } else {
                                    if (isTplFile(reg, tmpPath)) {
                                        handler(tmpPath, options);
                                    }
                                }  
                            }  
                        })  
                    });
                }  
            });
        } else {
            if(isTplFile(reg, path) ){
                handler(path, options); 
            }
        }
    }

    /**
     * 生成解析**的正则表达式
     * 
     * @inner
     * @param {Object} source 输入字符串
     * @return {Object} 正则表达式
     */
    function getFileReg(source) {
        var str = source.replace(/\*\*/g, '[^\\f\\n\\r\\t\\v\\.]+')
                     .replace(/\*/g, '[^\\/\\f\\n\\r\\t\\v\\.]+')
                     + '$';
        return new RegExp(str);
    }       

    /**
     * 获取target转换后的内容
     * 
     * @inner
     * @param {Object} engine 模版引擎
     * @param {Object} reg target名
     * @return {String} target内容
     */
    function getTargetContent(engine, name) {
        var target = engine.targets[ name ];
        return target.getConvertedContent(engine);
    }

    /**
     * 加载模版文件
     * 
     * @inner
     * @param {String} filePath 文件路径
     * @param {Function} callback 回调函数
     */
    function loadTpl(filePath, callback, options) {
        filePath = filterPath(filePath);

        var index = filePath.indexOf('*');
        var startPath = index > -1 
                        ? filePath.substr(0, index)
                        : filePath;

        var endPath = index > -1 
                        ? filePath.substr(index)
                        : '';

        startPath = path.normalize(startPath);
        startPath = fs.realpathSync(startPath); 
        options.startPath = startPath;

        var fullPath = endPath 
                        ? startPath + '/' + endPath
                        : startPath;
        fullPath = fullPath.indexOf('.') > 0
                    ? fullPath
                    : fullPath + '/*' + options.extName;                                    // 补齐后缀名

        fullPath = filterPath(fullPath);

        var reg = getFileReg(fullPath);

        walk(startPath, reg, callback, options);
    }

    /**
     * 模版转换
     * 
     * @inner
     * @param {String} fileName 模版文件名的
     */
    function transferTpl(fileName, options) {
        fs.readFile(fileName, encodeing, function(err, data){
            console.log(fileName);
            saveTpl(fileName, data, transfer(data), options);
        });
    }

    /**
     * 模版转换
     * 
     * @inner
     * @param {String} fileName 模版文件名的
     */
    function transfer(data) {
        var targets = engine.parse(data);
        var content = [];
        for (var i = 0; i < targets.length; i++) {
            var targetName = targets[i];
            content.push(
                trim(getTargetContent(engine, targetName))
            );
        }

        return content.join('\n\r\n\r');
    }

    /**
     * 保存转换后的模版
     * 
     * @inner
     * @param {String} fileName 模版文件名
     * @param {String} oldContent 原内容
     * @param {String} newContent 转换后内容
     */
    function saveTpl(fileName, oldContent, newContent, options){
        fileName = path.normalize(fileName);
        var outputPath = options.output
                            ? (
                                options.output
                                + fileName.substr(options.startPath.length)
                              )
                            : fileName;
        var dirName = path.dirname(outputPath);
        var extName = path.extname(outputPath) || options.extName; 
        var baseName = path.basename(outputPath, extName);
        
        switch(options.save) {
            case 'new':
                var newFileName = dirName + '/' + baseName + extName  + '_new';
                saveFile(newFileName, newContent);
                break;
            case 'old':
                var oldFileName = dirName + '/' + baseName + extName + '_old';
                saveFile(oldFileName, oldContent);
                saveFile(fileName, newContent);
                break;
            case 'replace':
                saveFile(fileName, newContent);
                break;
        }
    }

    /**
     * 过滤文件路径
     * 
     * @inner
     * @param {String} filePath 文件全路径
     * @return {String}  过滤后后路径
     */
    function filterPath(filePath) {
        return filePath.replace(/\\/g, '/')
                       .replace(/\/\//g, '/');
    }

    /**
     * 递归创建目录（同步）
     * 
     * @inner
     * @param {String} dirName 文件全路径
     */
    function mkdirs(dirName) {
        if(!fs.existsSync(dirName)){
            mkdirs(path.dirname(dirName));
            fs.mkdirSync(dirName);
        }
    }

    /**
     * 保存文件（同步），会自动创建目录
     * 
     * @inner
     * @param {String} filePath 文件全路径
     * @param {String} content 文件内容
     */
    function saveFile(filePath, content) {
        var dirname = path.dirname(filePath);
        if (!fs.existsSync(dirname)) {
            mkdirs(dirname);
        }
        fs.writeFile(filePath, content, encodeing);        
    }


    function convert(){
        var args = getArgs.apply(this, arguments);

        var configFileName = __dirname + '/' +
                            ( args['config'] || '../conf.js' );

        var data = fs.readFileSync(
            fs.realpathSync(configFileName),
            encodeing
        );

        extend(config, JSON.parse(data));

        engine.config(config);

        loadTpl(args.input, transferTpl, args); 
    }

    exports = module.exports = {
        convert: convert,
        transfer: transfer
    };

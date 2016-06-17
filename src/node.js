/**
 * ETPL (Enterprise Template)
 * Copyright 2016 Baidu Inc. All rights reserved.
 *
 * @file node环境支持模块，主要提供import和master的依赖文件自动加载功能
 * @author errorrik(errorrik@gmail.com)
 */


/* eslint-env node */

var etpl = require('./main');
var path = require('path');
var fs = require('fs');

/**
 * 加载模板文件
 *
 * @param {string} file 文件路径
 * @return {function(Object):string} renderer函数
 */
etpl.Engine.prototype.loadFromFile = function (file) {
    var load = this.load.bind(this);
    var targets = this.targets;

    /* jshint -W054 */
    var renderer = new Function('return ""');
    /* jshint +W054 */

    var encoding = this.options.encoding || 'UTF-8';
    var source = fs.readFileSync(file, encoding);

    var parseInfo = etpl.util.parseSource(source, this);
    var targetNames = parseInfo.targets;


    parseInfo.deps.forEach(function (dep) {
        if (!targets[dep]) {
            load(dep);
        }
    });

    if (targetNames.length) {
        renderer = targets[targetNames[0]].getRenderer();
    }

    return renderer;
};

/**
 * 加载target
 *
 * @param {string} targetName target名称
 * @return {function(Object):string} renderer函数
 */
etpl.Engine.prototype.load = function (targetName) {
    if (this.targets[targetName]) {
        return this.targets[targetName].getRenderer();
    }

    return this.loadFromFile(resolveTargetPath(targetName, this));
};


/**
 * 获取 target 对应的文件路径
 *
 * @inner
 * @param {string} targetName target名称
 * @param {Engine} engine etpl引擎
 * @return {string}
 */
function resolveTargetPath(targetName, engine) {
    var dir = engine.options.dir || process.pwd();
    var ext = engine.options.extname || '.etpl';

    return path.resolve(dir, targetName) + ext;
}


module.exports = exports = etpl;

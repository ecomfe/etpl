var etpl = require('./main');
var path = require('path');
var fs = require('fs');

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

etpl.Engine.prototype.load = function (targetName) {
    if (this.targets[targetName]) {
        return this.targets[targetName].getRenderer();
    }

    return this.loadFromFile(resolveTargetPath(targetName, this));
};



function resolveTargetPath(targetName, engine) {
    var dir = engine.options.dir || process.pwd();
    var ext = engine.options.extname || '.etpl';

    return path.resolve(dir, targetName) + ext;
}

module.exports = exports = etpl;

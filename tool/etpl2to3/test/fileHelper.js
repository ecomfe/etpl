var fs = require('fs');

function readFile(fileName, encodeing) {
    return fs.readFileSync(fileName, encodeing);
}

function replaceBreak(content) {
    return content.replace( /[\x20\t\r]*\n|[\x20\t\n]*\r/g, '');
}

exports = module.exports = {
    readFile: readFile,
    replaceBreak: replaceBreak
};
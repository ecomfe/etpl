var fileHelper = require('../fileHelper');
var convertor = require('../../src/main');
var encodeing = 'utf-8';

describe('Master', function() {
    it('can convert normal master', function() {
        var file = fileHelper.readFile(__dirname + '/master.tpl.html', encodeing);
        var sample = fileHelper.readFile(__dirname + '/master.result.html', encodeing);
        var result = convertor.transfer(file);
        var replaceBreak = fileHelper.replaceBreak;

        expect(replaceBreak(result)).toEqual(replaceBreak(sample));
    });

    it('can convert master with master', function() {
        var file = fileHelper.readFile(__dirname + '/masterWithMaster.tpl.html', encodeing);
        var sample = fileHelper.readFile(__dirname + '/masterWithMaster.result.html', encodeing);
        var result = convertor.transfer(file);
        var replaceBreak = fileHelper.replaceBreak;

        expect(replaceBreak(result)).toEqual(replaceBreak(sample));
    });
});
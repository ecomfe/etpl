var fileHelper = require('../fileHelper');
var convertor = require('../../src/main');
var encodeing = 'utf-8';

describe('Target', function() {
    it('can convert normal target', function() {
        var file = fileHelper.readFile(__dirname + '/target.tpl.html', encodeing);
        var sample = fileHelper.readFile(__dirname + '/target.result.html', encodeing);
        var result = convertor.transfer(file);
        var replaceBreak = fileHelper.replaceBreak;

        expect(replaceBreak(result)).toEqual(replaceBreak(sample));
    });

    it('can convert target width master', function() {
        var file = fileHelper.readFile(__dirname + '/targetWithMaster.tpl.html', encodeing);
        var sample = fileHelper.readFile(__dirname + '/targetWithMaster.result.html', encodeing);
        var result = convertor.transfer(file);
        var replaceBreak = fileHelper.replaceBreak;

        expect(replaceBreak(result)).toEqual(replaceBreak(sample));
    });

    it('can convert target and master', function() {
        var file = fileHelper.readFile(__dirname + '/targetAndMaster.tpl.html', encodeing);
        var sample = fileHelper.readFile(__dirname + '/targetAndMaster.result.html', encodeing);
        var result = convertor.transfer(file);
        var replaceBreak = fileHelper.replaceBreak;

        expect(replaceBreak(result)).toEqual(replaceBreak(sample));
    });
});
define(
    function (require) {
        // require specs
        
        require('spec/noTarget');
        require('spec/simpleTarget');
        require('spec/manyTargets');
        require('spec/variableSubstitution');
        require('spec/master');
        require('spec/import');
        require('spec/use');
        require('spec/for');
        require('spec/if');
        require('spec/var');
        require('spec/filter');
        require('spec/engine');
        require('spec/comment');
        require('spec/amdplugin');

        return {
            start: function () {
                var jasmineEnv = jasmine.getEnv();
                jasmineEnv.updateInterval = 1000;

                var htmlReporter = new jasmine.HtmlReporter();
                jasmineEnv.addReporter(htmlReporter);
                jasmineEnv.specFilter = function (spec) {
                    return htmlReporter.specFilter(spec);
                };

                jasmineEnv.execute();
            }
        };
    }
);

define(
    function (require) {
        // require specs
        require('spec/noTarget');
        require('spec/simpleTarget');
        require('spec/manyTargets');
        require('spec/variableSubstitution');
        require('spec/master');
        require('spec/import');
        require('spec/for');
        require('spec/if');

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

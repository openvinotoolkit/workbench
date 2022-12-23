// Karma configuration file, see link for more information
// https://karma-runner.github.io/0.13/config/configuration-file.html
var path = require('path');

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular', 'jasmine-matchers'],
    browserNoActivityTimeout: 50000,
    browserDisconnectTolerance: 2,
    plugins: [
      require('karma-jasmine'),
      require('karma-jasmine-matchers'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('karma-coverage-istanbul-reporter'),
      require('karma-junit-reporter'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: {
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
    },
    coverageIstanbulReporter: {
      reports: ['html', 'lcovonly'],
      fixWebpackSourcePaths: true,
      dir: path.join(__dirname, 'reports', 'unit_tests', 'coverage'),
      thresholds: {
        statements: 30,
        lines: 30,
        branches: 15.5,
        functions: 21,
      },
    },
    // the default configuration
    junitReporter: {
      outputDir: path.join(__dirname, 'reports', 'unit_tests'), // results will be saved as $outputDir/$browserName.xml
      outputFile: undefined, // if included, results will be saved as $outputDir/$browserName/$outputFile
      suite: '', // suite will become the package name attribute in xml testsuite element
      useBrowserName: true, // add browser name to report and classes names
      nameFormatter: undefined, // function (browser, result) to customize the name attribute in xml testcase element
      classNameFormatter: undefined, // function (browser, result) to customize the classname attribute in xml testcase element
      properties: {}, // key value pair of properties to add to the <properties> section of the report
    },
    angularCli: {
      environment: 'dev',
    },
    reporters:
      config.angularCli && config.angularCli.codeCoverage
        ? ['progress', 'coverage-istanbul', 'junit']
        : ['progress', 'kjhtml', 'junit'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['ChromeHeadless'],
    customLaunchers: {
      ChromeHeadless: {
        base: 'Chrome',
        flags: ['--headless', '--disable-gpu', '--no-sandbox', '--remote-debugging-port=9222'],
      },
    },
    singleRun: true,
  });
};

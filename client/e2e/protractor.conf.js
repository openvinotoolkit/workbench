// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts
const RestAPICalls = require('./restAPICalls.js');
const fs = require('fs-extra');
const path = require('path');
const { SpecReporter } = require('jasmine-spec-reporter');

const outputPath = './reports/e2e_tests/';
const screenshotFolderName = 'screenshots';
const screenShotPath = outputPath + '/' + screenshotFolderName + '/';

const logsFolderName = 'logs';
const logsPath = `${outputPath}/${logsFolderName}/`;
const proxyUrl = 'http://127.0.0.1:4200';
const urlServer = process.env['DL_PROFILER_DEPLOY_TARGET'] ? process.env['DL_PROFILER_DEPLOY_TARGET'] : proxyUrl;
const { defaultUsername: username } = require('../src/app/shared/constants');
const token = fs.readFileSync(process.env.TOKEN_FILE_PATH).toString();
const resources = process.env.RESOURCES_PATH;
const benchmarkPerformanceReportsPath = process.env.BENCHMARK_PERFORMANCE_REPORTS_PATH;
const launchEnvironment = process.env['LAUNCH_ENVIRONMENT'];
const isDevCloud = launchEnvironment === 'devCloud';
const isMaster = process.env['IS_MASTER'];
const isNightly = Number(process.env['IS_PRECOMMIT']) === 0;
const isRemote = process.env['REMOTE_PROFILING'];
const isPreConfigurationStage = process.env['FRAMEWORKS'];
const allScriptsTimeoutMultiplier = isNightly || isPreConfigurationStage ? 6 : 1;
const geckoDriverPath = process.env.GECKO_DRIVER_PATH;
const dockerConfigDir = process.env['WORKBENCH_PUBLIC_DIR'];
const devCloudCookies = process.env['DEV_CLOUD_COOKIES'];
const proxy = new URL(process.env['http_proxy']);
const chromeArgs = ['--no-sandbox', '--window-size=3000,3000', '--allow-insecure-localhost', '--disable-dev-shm-usage'];

if (!process.env['DISABLE_HEADLESS']) {
  chromeArgs.push('--headless', '--disable-infobar', '--disable-browser-side-navigation', '--disable-gpu');
}

const firefoxCapabilities = {
  browserName: 'firefox',
  marionette: true,
  acceptInsecureCerts: true,
  'moz:firefoxOptions': {
    args: ['--headless'],
    prefs: {
      'browser.download.folderList': 2,
      'browser.download.useDownloadDir': true,
      'browser.download.manager.alertOnEXEOpen': false,
      'browser.download.manager.closeWhenDone': true,
      'browser.download.manager.focusWhenStarting': false,
      'browser.download.manager.showWhenStarting': false,
      'browser.helperApps.alwaysAsk.force': false,
      'browser.download.manager.showAlertOnComplete': false,
      'browser.download.manager.useWindow': false,
      'browser.download.dir': path.join(__dirname, 'src', 'downloads'),
      'browser.helperApps.neverAsk.saveToDisk':
        'text/xml,application/gzip,application/tar+gzip,application/octet-stream',
    },
  },
};

const chromeCapabilities = {
  loggingPrefs: { browser: 'ALL' },
  browserName: 'chrome',
  'goog:chromeOptions': {
    args: chromeArgs,
    excludeSwitches: ['disable-popup-blocking'],
    prefs: {
      download: {
        prompt_for_download: false,
        directory_upgrade: true,
        default_directory: path.join(__dirname, 'src', 'downloads'),
      },
    },
  },
};
const currentCapabilities = process.env['TARGET_BROWSER'] === 'firefox' ? firefoxCapabilities : chromeCapabilities;
const listConsoleErrors = [
  {
    contain: 'MAX | analysis | modelId | ExpressionChangedAfterItHasBeenCheckedError',
    reasonForSkip: '26473',
  },
  {
    contain: 'UNPROCESSABLE',
    reasonForSkip: 'need for nightly: token gets expired on long tasks and should be renewed',
  },
  {
    contain: 'favicon.ico',
    reasonForSkip: 'skip errors with loading external resources',
  },
  {
    contain: '401 | UNAUTHORIZED',
    reasonForSkip: 'Expected response for expired authentication requests',
  },
  {
    contain: '400 | BAD | REQUEST',
    reasonForSkip: 'Expected response for requests with invalid data',
  },
  {
    contain: 'tms-loader',
    reasonForSkip: '28866',
  },
  {
    contain: 'google-analytics | googletagmanager',
    reasonForSkip: 'skip errors with requests to external (GA) servers',
  },
  {
    contain: 'attribute | transform | Expected | translate',
    reasonForSkip: '42618',
  },
  {
    contain: 'map | property',
    reasonForSkip: '46733',
  },
  {
    // prettier-ignore
    contain: '"ERROR"\\st\\n*',
    reasonForSkip: '48539',
  },
  {
    contain: 't.reduce',
    reasonForSkip: '49211',
  },
  {
    contain: 'dog',
    reasonForSkip: '54574',
  },
  {
    contain: 'originalModelId',
    reasonForSkip: '70941',
  },
  {
    // prettier-ignore
    contain: '"ERROR"\\se\\n*',
    reasonForSkip: '63354',
  },
  {
    contain: 'availableTransformationsConfigs',
    reasonForSkip: '76003',
  },
  {
    contain: "reading\\s'params'",
    reasonForSkip: '76003',
  },
];
const apiCalls = new RestAPICalls(urlServer, username, token);

exports.config = {
  params: {
    precommit_scope: {
      resources: require('./resources.json'),
      benchmarkPerformanceReportsPath: benchmarkPerformanceReportsPath,
      resource_dir: resources,
      downloadedFiles: path.join(__dirname, 'src', 'downloads'),
      ignoreConsoleErrors: listConsoleErrors,
      defaultTimeout: 100000,
    },
    defaultTimeout: 200000,
    calibrationCoefficient: 1.2,
    proxyHost: `${proxy.protocol}//${proxy.hostname}`,
    proxyPort: proxy.port,
    remoteMachine: process.env['REMOTE_MACHINE'],
    username,
    token,
    logsPath,
    screenShotPath,
    launchEnvironment,
    isMaster,
    dockerConfigDir,
    isNightly,
    devCloudCookies,
    isDevCloud,
    isRemote,
  },
  geckoDriver: geckoDriverPath,
  allScriptsTimeout: 600000 * allScriptsTimeoutMultiplier,
  specs: ['./**/*.e2e-spec.ts'],
  capabilities: currentCapabilities,
  suites: {
    uniUploadSuite: [
      './src/model-downloader.e2e-spec.ts',
      './src/import-hugging-face-models.e2e-spec.ts',
      './src/upload-dataset.e2e-spec.ts',
      './src/upload-models-model-manager.e2e-spec.ts',
      './src/upload-calibration-dataset.e2e-spec.ts',
    ],
    uniUiSuite: [
      './src/initial-html.e2e-spec.ts',
      './src/home-page.e2e-spec.ts',
      './src/explainable-ai.e2e-spec.ts',
      './src/authentication.e2e-spec.ts',
      './src/dev-cloud.e2e-spec.ts',
      './src/per-layer-report-downloading.e2e-spec.ts',
      './src/advanced-accuracy-configuration.e2e-spec.ts',
      './src/model-page.e2e-spec.ts',
      './src/create-na-dataset.e2e-spec.ts',
      './src/model-import-form.e2e-spec.ts',
      './src/accuracy-reports.e2e-spec.ts',
    ],
    cpuSuite: ['./src/run-inference-cpu.e2e-spec.ts', './src/smoke-cpu.e2e-spec.ts'],
    gpuSuite: ['./src/smoke-gpu.e2e-spec.ts'],
    vpuSuite: ['./src/smoke-vpu.e2e-spec.ts'],
    cpuGpuSuite: ['./src/projects-creation.e2e-spec.ts', './src/projects-comparison.e2e-spec.ts'],
    packagingSuite: ['./src/deployment-manager.e2e-spec.ts'],
    int8BasicSuite: [
      './src/int8-basic-cases.e2e-spec.ts',
      // 74913
      // './src/smoke-nightly.e2e-spec.ts',
      './src/project-placement.e2e-spec.ts',
    ],
    int8GPU: ['./src/int8-gpu.e2e-spec.ts'],
    int8AdvancedSuite: ['./src/int8-advanced-cases.e2e-spec.ts'],
    int8FaceRecognitionSuite: ['./src/int8-face-recognition.e2e-spec.ts'],
    tf2Suite: ['./src/tensor-flow-2.e2e-spec.ts'],
    segmentationSuite: ['./src/instance-segmentation.e2e-spec.ts', './src/semantic-segmentation.e2e-spec.ts'],
    netronSuite: ['./src/netron.e2e-spec.ts'],
    smokeSuite: [
      './src/smoke-cpu.e2e-spec.ts',
      './src/smoke-vpu.e2e-spec.ts',
      './src/smoke-gpu.e2e-spec.ts',
      './src/smoke-nightly.e2e-spec.ts',
    ],
    smokeCPU: ['./src/smoke-cpu.e2e-spec.ts'],
    smokeE2EFlow: ['./src/smoke-e2e-flow.e2e-spec.ts'],
    disabledHeadless: ['./src/headless-mode-off.e2e-spec.ts'],
    performanceSuite: ['./src/benchmark-performance.e2e-spec.ts'],
    remoteProfilingSuite: [
      './src/remote-profiling.e2e-spec.ts',
      './src/remote-profiling-troubleshooting.e2e-spec.ts',
      './src/remote-calibration.e2e-spec.ts',
      './src/accuracy-reports.e2e-spec.ts',
    ],
    eraseAll: ['./src/erase-all.e2e-spec.ts'],
    profilingReportDownloading: ['./src/profiling-report-downloading.e2e-spec.ts'],
    projectExport: ['./src/project-export.e2e-spec.ts'],
    projectErrorHandlingSuite: ['./src/project-error-handling.e2e-spec.ts'],
    largeDatasetUploadingSuite: ['./src/large-dataset-uploading.e2e-spec.ts'],
    databaseDumpSuite: ['./src/create-projects-for-dump.e2e-spec.ts'],
    databaseRestorationSuite: ['./src/check-restored-state.e2e-spec.ts'],
    devCloudSuite: [
      './src/dev-cloud.e2e-spec.ts',
      './src/smoke-vpu.e2e-spec.ts',
      './src/inference-test-image.e2e-spec.ts',
      './src/parent-predictions-visualization.e2e-spec.ts',
      // TODO: 69118
      // './src/not-annotated-model-visualization.e2e-spec.ts',
      './src/explainable-ai.e2e-spec.ts',
    ],
    devCloudAccuracySuite: ['./src/accuracy-reports.e2e-spec.ts'],
    disabledHeadlessMode: ['./src/headless-mode-off.e2e-spec.ts', './src/uploading-nlp-models.e2e-spec.ts'],
    inferenceVisualizationSuite: [
      './src/inference-test-image.e2e-spec.ts',
      './src/parent-predictions-visualization.e2e-spec.ts',
      './src/model-visualization.e2e-spec.ts',
      './src/not-annotated-model-visualization.e2e-spec.ts',
    ],
    ganSuite: ['./src/gan.e2e-spec.ts'],
    jupyterPreparation: ['./src/jupyter-resources.e2e-spec.ts'],
    jupyterDeletion: ['./src/jupyter-resources-deletion.e2e-spec.ts'],
    migrationInferenceTest: ['./src/migration-release-test.e2e-spec.ts'],
    migrationCheckRestore: ['./src/migration-check-restored.e2e-spec.ts'],
    preConfiguration: ['./src/pre-configuration.e2e-spec.ts'],
    accuracyReportsSuite: ['./src/accuracy-report-classification.e2e-spec.ts'],
    nightlySuite: ['./src/nightly-omz-tests.e2e-spec.ts'],
    nightlyOpenvinoInt8Suite: ['./src/nightly-omz-openvino-int8.e2e-spec.ts'],
    nightlyOpenvinoAccuracySuite: ['./src/nightly-omz-openvino-AccuracyAwareQuantization.e2e-spec.ts'],
    nightlyCaffeAccuracySuite: ['./src/nightly-omz-caffe-AccuracyAwareQuantization.e2e-spec.ts'],
    nightlyCaffe2AccuracySuite: ['./src/nightly-omz-caffe2-AccuracyAwareQuantization.e2e-spec.ts'],
    nightlyMxnetAccuracySuite: ['./src/nightly-omz-mxnet-AccuracyAwareQuantization.e2e-spec.ts'],
    nightlyPytorchAccuracySuite: ['./src/nightly-omz-pytorch-AccuracyAwareQuantization.e2e-spec.ts'],
    nightlyTfAccuracySuite: ['./src/nightly-omz-tf-AccuracyAwareQuantization.e2e-spec.ts'],
    nightlyOpenvinoPerformanceSuite: ['./src/nightly-omz-openvino-DefaultQuantization.e2e-spec.ts'],
    nightlyCaffePerformanceSuite: ['./src/nightly-omz-caffe-DefaultQuantization.e2e-spec.ts'],
    nightlyCaffe2PerformanceSuite: ['./src/nightly-omz-caffe2-DefaultQuantization.e2e-spec.ts'],
    nightlyMxnetPerformanceSuite: ['./src/nightly-omz-mxnet-DefaultQuantization.e2e-spec.ts'],
    nightlyPytorchPerformanceSuite: ['./src/nightly-omz-pytorch-DefaultQuantization.e2e-spec.ts'],
    nightlyTfPerformanceSuite: ['./src/nightly-omz-tf-DefaultQuantization.e2e-spec.ts'],
    nightlySegmentationSuite: ['./src/nightly-segmentation.e2e-spec.ts'],
  },
  directConnect: true,
  baseUrl: 'http://localhost:4200/',
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 800000 * allScriptsTimeoutMultiplier,
  },
  onPrepare: async () => {
    console.log('onPrepare: start waiting for the Angular page to be stable ', Date.now());
    await browser.sleep(7000);
    console.log('onPrepare: assuming Angular page is stable ', Date.now());

    const caps = await browser.getCapabilities();
    browser.currentBrowserName = caps.get('browserName');

    if (browser.currentBrowserName === 'firefox') {
      const width = 2000;
      const height = 2000;
      await browser.driver.manage().window().setSize(width, height);
    }

    require('ts-node').register({
      project: path.join(__dirname, './tsconfig.e2e.json'),
    });

    const tsConfigE2E = require('./tsconfig.e2e.json');

    require('tsconfig-paths').register({
      project: path.join(__dirname, './tsconfig.e2e.json'),
      baseUrl: path.join(__dirname),
      paths: tsConfigE2E.compilerOptions.paths,
    });

    const artifactDirectories = [screenShotPath, path.join(__dirname, 'src', 'downloads'), logsPath];

    artifactDirectories.forEach((directory) => {
      fs.ensureDir(directory, function (err) {
        console.log(err);
      });
    });

    jasmine.getEnv().addReporter({
      specStarted: (result) => (browser.currentTest = result),
      specDone: function (result) {
        if (result.status === 'failed') {
          browser.getCapabilities().then(function (caps) {
            var browserName = caps.get('browserName');

            browser.takeScreenshot().then(function (png) {
              result.fullName = result.fullName
                .split('!')
                .filter(function (el) {
                  return Boolean(el);
                })
                .map(function (el, index, fullData) {
                  return index === 1
                    ? '!.' + el.substr(1)
                    : index === 0 && fullData.length > 1
                    ? el.substr(0, el.length - 1)
                    : el;
                })
                .join(' ');
              var stream = fs.createWriteStream(screenShotPath + browserName + '-' + result.fullName + '.png');
              stream.write(new Buffer(png, 'base64'));
              stream.end();

              if (launchEnvironment !== 'devCloud') {
                apiCalls
                  .getLog(urlServer, logsPath, `${browserName}-${result.fullName}`)
                  .then((res) => {
                    console.log(res);
                  })
                  .catch((error) => console.error(error));
              }
            });
          });
        }
      },
    });

    var jasmineReporters = require('jasmine-reporters');
    var junitReporter = new jasmineReporters.JUnitXmlReporter({
      // setup the output path for the junit reports
      savePath: `${outputPath}${browser.currentBrowserName}/`,
      consolidateAll: true,
    });
    jasmine.getEnv().addReporter(junitReporter);

    jasmine.getEnv().addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));
  },
  //HTMLReport called once tests are finished
  onComplete: function () {
    let browserName, browserVersion;
    let capsPromise = browser.getCapabilities();

    capsPromise.then(function (caps) {
      browserName = caps.get('browserName');
      browserVersion = caps.get('version');
      platform = caps.get('platform');

      let HTMLReport = require('protractor-html-reporter-2');

      let e2eReportName = `protractor_e2e_report_${browserName}`;

      if (process.env.smoke) {
        e2eReportName = `protractor_e2e_smoke_report_${browserName}`;
      } else if (process.env.REMOTE_PROFILING) {
        e2eReportName = `protractor_e2e_report_remote_profiling`;
      }

      testConfig = {
        reportTitle: 'Protractor Test Execution Report',
        outputPath: outputPath,
        outputFilename: e2eReportName,
        screenshotPath: './' + screenshotFolderName,
        testBrowser: browserName,
        browserVersion: browserVersion,
        modifiedSuiteName: false,
        screenshotsOnlyOnFailure: true,
        testPlatform: platform,
      };
      new HTMLReport().from(`${outputPath}${browserName}/junitresults.xml`, testConfig);
    });
  },
};

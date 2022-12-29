import { browser, protractor } from 'protractor';

import { AppPage } from './pages/home-page.po';
import { ConfigurationWizardPage } from './pages/configuration-wizard.po';
import { Helpers } from './pages/helpers';
import { TestUtils } from './pages/test-utils';

describe('UI tests on Uploading Large Datasets', () => {
  let homePage: AppPage;
  let configurationWizard: ConfigurationWizardPage;
  let helpers: Helpers;
  let protractorUntil;
  const resources = browser.params.precommit_scope.resources;
  // TODO: Add COCO (cocoVal2014, cocoVal2017) datasets when the dataset checking time is reduced
  // Tracked by: 31812
  const datasets = {
    VOC2007: resources['VOCVal2007'],
    VOC2010: resources['VOCVal2010'],
    VOC2012: resources['VOCVal2012'],
    // TODO: 78041
    // ImageNet: resources['imageNet2012'],
  };

  beforeAll(async () => {
    homePage = new AppPage();
    configurationWizard = new ConfigurationWizardPage();
    helpers = new Helpers();
    protractorUntil = protractor.ExpectedConditions;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = jasmine.DEFAULT_TIMEOUT_INTERVAL * 2;
  });

  beforeEach(async () => {
    await new TestUtils().testPreparation();
    await homePage.openConfigurationWizard();
  });

  async function testDatasetUploading(datasetName, datasetFile) {
    it('should import ' + datasetName + ' and delete it after it is uploaded.', async () => {
      await configurationWizard.importDatasetFile(datasetFile, browser.params.precommit_scope.resource_dir);
    });
  }

  for (const datasetName of Object.keys(datasets)) {
    testDatasetUploading(datasetName, datasets[datasetName]);
  }

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });
});

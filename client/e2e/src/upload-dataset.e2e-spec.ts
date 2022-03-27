import { browser, protractor } from 'protractor';

import { DatasetTypeNames } from '@store/dataset-store/dataset.model';

import { AppPage } from './pages/home-page.po';
import { ConfigurationWizardPage } from './pages/configuration-wizard.po';
import { Helpers } from './pages/helpers';
import { TestUtils } from './pages/test-utils';

describe('UI tests on Uploading Datasets', () => {
  let testUtils: TestUtils;
  let homePage: AppPage;
  let configurationWizard: ConfigurationWizardPage;
  let helpers: Helpers;
  let protractorUntil;

  beforeAll(async () => {
    testUtils = new TestUtils();
    homePage = new AppPage();
    configurationWizard = new ConfigurationWizardPage();
    helpers = new Helpers();
    protractorUntil = protractor.ExpectedConditions;
  });

  beforeEach(async () => {
    await new TestUtils().testPreparation();
    await homePage.openConfigurationWizard();
  });

  it('should navigate to create project wizard select dataset step', async () => {
    expect(await browser.getCurrentUrl()).toContain('/projects/create');
  });

  it('should check import dataset page default state', async () => {
    await configurationWizard.openImportDatasetFilePage();
    await configurationWizard.selectImportDatasetTab();
    expect(await configurationWizard.datasetNameInput.getAttribute('value')).toEqual('');
    expect(await configurationWizard.uploadButton.isEnabled()).toBe(false);
    expect(await configurationWizard.uploadButton.getText()).toEqual('Import');
  });

  it('should import VOC dataset and delete it after it is uploaded', async () => {
    const dataset_file = browser.params.precommit_scope.resources.VOCDataset;
    dataset_file.name = helpers.generateName();
    await configurationWizard.importDatasetFile(dataset_file, browser.params.precommit_scope.resource_dir);
  });

  it('should import ImageNet dataset and delete it after it is uploaded', async () => {
    const dataset_file = browser.params.precommit_scope.resources.imageNetDataset;
    dataset_file.name = helpers.generateName();
    await configurationWizard.importDatasetFile(dataset_file, browser.params.precommit_scope.resource_dir);
  });

  it('should import LFW dataset and delete it after it is uploaded', async () => {
    const dataset_file = browser.params.precommit_scope.resources.LFWDataset;
    dataset_file.name = helpers.generateName();
    await configurationWizard.importDatasetFile(dataset_file, browser.params.precommit_scope.resource_dir);
  });

  it('should import VggFaces2 dataset and delete it after it is uploaded', async () => {
    const dataset_file = browser.params.precommit_scope.resources.VggFaces2Dataset;
    dataset_file.name = helpers.generateName();
    await configurationWizard.importDatasetFile(dataset_file, browser.params.precommit_scope.resource_dir);
  });

  it('should import dataset packed with subdir and delete it after it is uploaded', async () => {
    const dataset_file = browser.params.precommit_scope.resources.smallImageNetSubdirDataset;
    dataset_file.name = helpers.generateName();
    await configurationWizard.importDatasetFile(dataset_file, browser.params.precommit_scope.resource_dir);
  });

  it('should import COCO and delete it after it is uploaded', async () => {
    const dataset_file = browser.params.precommit_scope.resources.cocoDataset;
    dataset_file.name = helpers.generateName();
    await configurationWizard.importDatasetFile(dataset_file, browser.params.precommit_scope.resource_dir);
  });

  it('should import VOC segmentation dataset and delete it after it is uploaded', async () => {
    const dataset_file = browser.params.precommit_scope.resources.VOCSegmentationDataset;
    dataset_file.name = helpers.generateName();
    await configurationWizard.importDatasetFile(dataset_file, browser.params.precommit_scope.resource_dir);
  });

  // TODO: 82461
  xit('should import CSS dataset and delete it after it is uploaded', async () => {
    const dataset_file = browser.params.precommit_scope.resources.CSSDataset;
    dataset_file.name = helpers.generateName();
    await configurationWizard.importDatasetFile(dataset_file, browser.params.precommit_scope.resource_dir);
  });

  it('should import Wider dataset and delete it after it is uploaded', async () => {
    const dataset_file = browser.params.precommit_scope.resources.WiderFaceDataset;
    dataset_file.name = helpers.generateName();
    await configurationWizard.importDatasetFile(dataset_file, browser.params.precommit_scope.resource_dir);
  });

  it('should import Open Images dataset and delete it after it is uploaded', async () => {
    const dataset_file = browser.params.precommit_scope.resources.OpenImagesDataset;
    dataset_file.name = helpers.generateName();
    await configurationWizard.importDatasetFile(dataset_file, browser.params.precommit_scope.resource_dir);
  });

  it(
    'should import ImageNet dataset with unrelated files and folders inside, ' +
      'check that it is uploaded and delete it',
    async () => {
      const datasetFile = browser.params.precommit_scope.resources.imageNetWithUnrelatedFiles;
      datasetFile.name = helpers.generateName();
      await configurationWizard.importDatasetFile(datasetFile, browser.params.precommit_scope.resource_dir);
    }
  );

  it(
    'should import COCO dataset with unrelated files and folders inside, ' + 'check that it is uploaded and delete it',
    async () => {
      const datasetFile = browser.params.precommit_scope.resources.cocoWithUnrelatedFiles;
      datasetFile.name = helpers.generateName();
      await configurationWizard.importDatasetFile(datasetFile, browser.params.precommit_scope.resource_dir);
    }
  );

  it('should upload corrupted COCO dataset, click Try Again, get error message', async () => {
    const invalidDatasetFile = browser.params.precommit_scope.resources.cocoCorruptedDataset;
    const validDatasetFile = browser.params.precommit_scope.resources.cocoDataset;
    invalidDatasetFile.name = helpers.generateName();
    validDatasetFile.name = helpers.generateName();
    await configurationWizard.importDatasetFile(invalidDatasetFile, browser.params.precommit_scope.resource_dir, false);

    await testUtils.waitForDatasetRows();

    const uploadedElementsCount = await testUtils.configurationWizard.uploadsDatasetTableElementsCount();

    expect(await testUtils.configurationWizard.isNotificationAvailable()).toBeTruthy('Notification is not available');

    await testUtils.configurationWizard.closeAllNotifications();

    expect(
      await testUtils.configurationWizard.tryAgainImportDatasetFile(
        validDatasetFile,
        invalidDatasetFile.name,
        browser.params.precommit_scope.resource_dir,
        uploadedElementsCount
      )
    ).toBeTruthy();
  });

  // TODO  unskip then resolve 28096
  xit('should import imageNet dataset and cancel it during upload', async () => {
    // refreshing due to ghosts presence
    const uploadedElementsCount = await configurationWizard.uploadsDatasetTableElementsCount();
    const datasetFile = browser.params.precommit_scope.resources.imageNetDataset;
    datasetFile.name = helpers.generateName();
    await configurationWizard.openImportDatasetFilePage();
    await configurationWizard.selectImportDatasetTab();
    await configurationWizard.selectDatasetFile(datasetFile, browser.params.precommit_scope.resource_dir);

    await browser.wait(
      protractorUntil.elementToBeClickable(configurationWizard.uploadButton),
      browser.params.defaultTimeout
    );
    await configurationWizard.uploadButton.click();

    console.log('started uploading');
    await configurationWizard.cancelUploading(datasetFile.name);
    console.log('finished cancellation logic');
    expect(await configurationWizard.isUploadCancelled(datasetFile.name)).toBeTruthy();
    console.log('checked that cancelled');
    await browser.refresh();
    await browser.sleep(1000);
    const uploadedElementsCountAfter = await configurationWizard.uploadsDatasetTableElementsCount();
    expect(uploadedElementsCountAfter).toEqual(uploadedElementsCount);
  });

  // TODO: 69235
  xit('should import Cityscapes dataset with Auto-detect type and delete it after it is uploaded', async () => {
    const dataset_file = browser.params.precommit_scope.resources.CityscapesDataset;
    dataset_file.name = helpers.generateName();
    await configurationWizard.importDatasetFile(dataset_file, browser.params.precommit_scope.resource_dir);
  });

  it('should import Cityscapes dataset with Cityscapes type and delete it after it is uploaded', async () => {
    const datasetFile = browser.params.precommit_scope.resources.CityscapesDataset;
    datasetFile.name = helpers.generateName();
    await configurationWizard.importDatasetFile(
      datasetFile,
      browser.params.precommit_scope.resource_dir,
      true,
      DatasetTypeNames.CITYSCAPES
    );
  });

  it('should import NLP Classifications dataset, validate info and delete it after it is uploaded', async () => {
    const datasetFile = browser.params.precommit_scope.resources.nlpDatasets.imdb;
    datasetFile.name = helpers.generateName();
    await configurationWizard.importNLPDataset(datasetFile, browser.params.precommit_scope.resource_dir);
    await configurationWizard.validateDatasetInfo(datasetFile);
    await configurationWizard.deleteUploadedFile(datasetFile.name);
  });

  it('should import NLP entailment dataset, validate info and delete it after it is uploaded', async () => {
    const datasetFile = browser.params.precommit_scope.resources.nlpDatasets.snli;
    datasetFile.name = helpers.generateName();
    await configurationWizard.importNLPDataset(datasetFile, browser.params.precommit_scope.resource_dir);
    await configurationWizard.validateDatasetInfo(datasetFile);
    await configurationWizard.deleteUploadedFile(datasetFile.name);
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });
});

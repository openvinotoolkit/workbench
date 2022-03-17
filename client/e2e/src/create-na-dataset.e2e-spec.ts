import { browser, protractor } from 'protractor';

import { AppPage } from './pages/home-page.po';
import {
  ConfigurationWizardPage,
  InferenceType,
  NotAnnotatedDataSet,
  TranformationOptions,
} from './pages/configuration-wizard.po';
import { Helpers } from './pages/helpers';
import { TestUtils } from './pages/test-utils';
import { InferenceUtils } from './pages/inference-utils';

describe('UI tests on Creating Not Annotated Datasets', () => {
  let homePage: AppPage;
  let configurationWizard: ConfigurationWizardPage;
  let helpers: Helpers;
  let protractorUntil;
  let inferenceUtils;
  let testUtils;
  let dataSet;
  const defaultImageCount = 14;

  const images = [
    browser.params.precommit_scope.resources.testImages.classificationImage,
    browser.params.precommit_scope.resources.testImages.ODImage,
    browser.params.precommit_scope.resources.testImages.instanceSegmImage,
    browser.params.precommit_scope.resources.testImages.semanticSegmImage,
    browser.params.precommit_scope.resources.testImages.streetImage,
  ];

  beforeAll(async () => {
    homePage = new AppPage();
    configurationWizard = new ConfigurationWizardPage();
    helpers = new Helpers();
    inferenceUtils = new InferenceUtils();
    testUtils = new TestUtils();
    protractorUntil = protractor.ExpectedConditions;
  });

  beforeEach(async () => {
    dataSet = new NotAnnotatedDataSet(helpers.generateName(), images);
    await new TestUtils().testPreparation();
    await homePage.openConfigurationWizard();
  });

  it('should check create dataset page default state', async () => {
    await configurationWizard.openImportDatasetFilePage();
    await browser.wait(
      protractor.ExpectedConditions.stalenessOf(configurationWizard.naDatasetSpinner),
      browser.params.defaultTimeout
    );
    expect(await configurationWizard.datasetNameInput.getAttribute('value')).toEqual('My Custom Dataset');
    expect(await configurationWizard.uploadButton.isEnabled()).toBe(true);
    expect(await configurationWizard.uploadButton.getText()).toEqual('Import');
    const uploadedImagesCount = await configurationWizard.createNADatasetImageCount();
    expect(uploadedImagesCount).toEqual(14);
  });

  it('should create not annotated dataset with some images', async () => {
    dataSet.imageFiles = [
      browser.params.precommit_scope.resources.testImages.classificationImage,
      browser.params.precommit_scope.resources.testImages.ODImage,
    ];
    const uploadedDatasetsCount = await configurationWizard.uploadsDatasetTableElementsCount();
    await configurationWizard.openImportDatasetFilePage();
    const uploadedImagesCount = await configurationWizard.createNADatasetImageCount();
    expect(uploadedImagesCount).toEqual(14);
    await configurationWizard.uploadImagesForNADataset(dataSet.name, dataSet.imageFiles);
    expect(await configurationWizard.createNADatasetImageCount()).toEqual(
      uploadedImagesCount + dataSet.imageFiles.length
    );
    expect(await configurationWizard.uploadButton.isEnabled()).toBeTruthy();
    await configurationWizard.importDataset(dataSet.name);
    expect(await configurationWizard.uploadsDatasetTableElementsCount()).toEqual(uploadedDatasetsCount + 1);
    await configurationWizard.deleteUploadedFile(dataSet.name);
    expect(await configurationWizard.uploadsDatasetTableElementsCount()).toEqual(uploadedDatasetsCount);
  });

  it('should add two images and remove them', async () => {
    await configurationWizard.openImportDatasetFilePage();
    const uploadedImagesCount = await configurationWizard.createNADatasetImageCount();
    await configurationWizard.uploadImagesForNADataset(dataSet.name, dataSet.imageFiles);
    expect(await configurationWizard.createNADatasetImageCount()).toEqual(
      uploadedImagesCount + dataSet.imageFiles.length
    );
    await configurationWizard.deleteImages(dataSet.imageFiles);
  });

  // TODO: 54325
  xit('should create not annotated dataset and run inference', async () => {
    const modelFile = browser.params.precommit_scope.resources.classificationModels.squeezenetV1;
    const inferenceTarget = InferenceType.CPU;
    modelFile.name = helpers.generateName();

    await configurationWizard.openDatasetPageAndImportImages(dataSet);
    await configurationWizard.importDataset(dataSet.name);

    await testUtils.modelManagerPage.goToModelManager();
    await inferenceUtils.runInference(modelFile, dataSet, inferenceTarget, browser.params.precommit_scope.resource_dir);
  });

  it('should select all the transformation options and create a dataset', async () => {
    dataSet.imageFiles = [browser.params.precommit_scope.resources.testImages.classificationImage];
    await configurationWizard.openDatasetPageAndImportImages(dataSet);

    await configurationWizard.selectAllTransformation();

    await configurationWizard.importDataset(dataSet.name);
    await configurationWizard.deleteUploadedFile(dataSet.name);
  });

  it('should select horizontal flip, create a dataset and check what transform image is present', async () => {
    dataSet.imageFiles = [browser.params.precommit_scope.resources.testImages.streetImage];
    await configurationWizard.openDatasetPageAndImportImages(dataSet);

    await configurationWizard.selectTransformationOption(TranformationOptions.HORIZONTAL);
    await configurationWizard.importDataset(dataSet.name);

    expect(await configurationWizard.checkImagesInDataset(dataSet.name, TranformationOptions.HORIZONTAL)).toBeTruthy(
      `Image not found in dataset`
    );

    await configurationWizard.deleteUploadedFile(dataSet.name);
  });

  it('should select vertical flip, create a dataset and check what transform image is present', async () => {
    dataSet.imageFiles = [browser.params.precommit_scope.resources.testImages.personImage];
    await configurationWizard.openDatasetPageAndImportImages(dataSet);

    await configurationWizard.selectTransformationOption(TranformationOptions.VERTICAL);
    await configurationWizard.importDataset(dataSet.name);

    expect(await configurationWizard.checkImagesInDataset(dataSet.name, TranformationOptions.VERTICAL)).toBeTruthy(
      `Image not found in dataset`
    );

    await configurationWizard.deleteUploadedFile(dataSet.name);
  });

  it('should select random erase, create a dataset and check count images in dataset', async () => {
    dataSet.imageFiles = [
      browser.params.precommit_scope.resources.testImages.streetImage,
      browser.params.precommit_scope.resources.testImages.personImage,
    ];
    await configurationWizard.openDatasetPageAndImportImages(dataSet);

    await configurationWizard.selectTransformationOption(TranformationOptions.ERASE);

    const eraseRatio = Helpers.getRandomInRange(1, 21);
    console.log(`Set value of erase ratio to ${eraseRatio}%`);
    await TestUtils.setInput('eraseRatio', eraseRatio);
    await browser.sleep(1000);

    const generateImageCount = Helpers.getRandomInRange(1, 21);
    console.log(`Set value of images to ${generateImageCount}`);
    await TestUtils.setInput('eraseImages', generateImageCount);
    await browser.sleep(1000);

    await configurationWizard.importDataset(dataSet.name);

    const expectedImageCount =
      dataSet.imageFiles.length +
      defaultImageCount +
      (dataSet.imageFiles.length + defaultImageCount) * generateImageCount;
    const imageInDataset = await configurationWizard.getImagesCountFromDataset(
      browser.params.dockerConfigDir,
      dataSet.name
    );
    expect(imageInDataset).toEqual(
      expectedImageCount,
      `Image in dataset: ${imageInDataset} not equal ${expectedImageCount}`
    );

    await configurationWizard.deleteUploadedFile(dataSet.name);
  });

  it('should select random erase, enter invalid values in the fields and check warnings is show and button is disable', async () => {
    dataSet.imageFiles = [browser.params.precommit_scope.resources.testImages.personImage];
    await configurationWizard.openDatasetPageAndImportImages(dataSet);

    await configurationWizard.selectTransformationOption(TranformationOptions.ERASE);

    const eraseRatio = 21;
    await TestUtils.setInput('eraseRatio', eraseRatio);
    await browser.sleep(1000);
    expect(await configurationWizard.checkErrorMessage(eraseRatio)).toBeGreaterThan(
      0,
      'Warning massage for erase ratio is not present'
    );

    const generateImageCount = 31;
    await TestUtils.setInput('eraseImages', generateImageCount);
    await browser.sleep(1000);
    expect(await configurationWizard.checkErrorMessage(generateImageCount)).toBeGreaterThan(
      0,
      'Warning massage for images count is not present'
    );
  });

  it('should select noise injection, create a dataset and check count images in dataset', async () => {
    dataSet.imageFiles = [
      browser.params.precommit_scope.resources.testImages.streetImage,
      browser.params.precommit_scope.resources.testImages.personImage,
    ];
    await configurationWizard.openDatasetPageAndImportImages(dataSet);

    await configurationWizard.selectTransformationOption(TranformationOptions.NOISE);

    const noiseInjection = Helpers.getRandomInRange(1, 5);
    console.log(`Set value of noise injection to ${noiseInjection}%`);
    await TestUtils.setInput('noiseRatio', noiseInjection);
    await browser.sleep(1000);

    const generateImageCount = Helpers.getRandomInRange(10, 21);
    console.log(`Set value of images to ${generateImageCount}`);
    await TestUtils.setInput('noiseImages', generateImageCount);
    await browser.sleep(1000);

    await configurationWizard.importDataset(dataSet.name);

    const expectedImageCount =
      dataSet.imageFiles.length +
      defaultImageCount +
      (dataSet.imageFiles.length + defaultImageCount) * generateImageCount;
    const imageInDataset = await configurationWizard.getImagesCountFromDataset(
      browser.params.dockerConfigDir,
      dataSet.name
    );
    expect(imageInDataset).toEqual(
      expectedImageCount,
      `Image in dataset: ${imageInDataset} not equal ${expectedImageCount}`
    );

    await configurationWizard.deleteUploadedFile(dataSet.name);
  });

  it('should select noise injection, enter invalid values in the fields and check warnings is show and button is disable', async () => {
    dataSet.imageFiles = [browser.params.precommit_scope.resources.testImages.personImage];
    await configurationWizard.openDatasetPageAndImportImages(dataSet);

    await configurationWizard.selectTransformationOption(TranformationOptions.NOISE);

    const noiseInjection = 5.01;
    await TestUtils.setInput('noiseRatio', noiseInjection);
    await browser.sleep(1000);
    expect(await configurationWizard.checkErrorMessage(noiseInjection)).toBeGreaterThan(
      0,
      'Warning massage for noise injection input is not present'
    );

    const generateImageCount = 31;
    console.log(`Set value of images to ${generateImageCount}`);
    await TestUtils.setInput('noiseImages', generateImageCount);
    await browser.sleep(1000);
    expect(await configurationWizard.checkErrorMessage(generateImageCount)).toBeGreaterThan(
      0,
      'Warning massage for images count input is not present'
    );
  });

  it('should select color transformations, create a dataset and check count images in dataset', async () => {
    dataSet.imageFiles = [
      browser.params.precommit_scope.resources.testImages.streetImage,
      browser.params.precommit_scope.resources.testImages.personImage,
    ];
    const presetsCount = 6;
    await configurationWizard.openDatasetPageAndImportImages(dataSet);

    await configurationWizard.selectTransformationOption(TranformationOptions.COLOR);

    await configurationWizard.importDataset(dataSet.name);

    const expectedImageCount =
      dataSet.imageFiles.length + defaultImageCount + (dataSet.imageFiles.length + defaultImageCount) * presetsCount;
    const imageInDataset = await configurationWizard.getImagesCountFromDataset(
      browser.params.dockerConfigDir,
      dataSet.name
    );
    expect(imageInDataset).toEqual(
      expectedImageCount,
      `Image in dataset: ${imageInDataset} not equal ${expectedImageCount}`
    );

    await configurationWizard.deleteUploadedFile(dataSet.name);
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });
});

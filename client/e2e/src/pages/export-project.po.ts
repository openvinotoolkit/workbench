import { browser, ElementFinder, protractor, ProtractorExpectedConditions } from 'protractor';

import { TestUtils } from './test-utils';

export class ProjectExportConfig {
  includeModel: boolean;
  includeDataset: boolean;
  includeAccuracyConfig: boolean;
  includeCalibrationConfig: boolean;
  modelName: string;
  datasetName: string;

  constructor(modelName: string, datasetName: string, filesToInclude: object) {
    this.modelName = modelName;
    this.datasetName = datasetName;
    this.includeModel = filesToInclude['includeModel'];
    this.includeDataset = filesToInclude['includeDataset'];
    this.includeAccuracyConfig = filesToInclude['includeAC'];
    this.includeCalibrationConfig = filesToInclude['includeCC'];
  }

  get archiveName(): string {
    return `${this.modelName}_${this.datasetName}.tar.gz`;
  }

  get archivePath(): string {
    return `${browser.params.precommit_scope.downloadedFiles}/${this.archiveName}`;
  }
}

export class ExportSheet {
  testUtils: TestUtils;
  until: ProtractorExpectedConditions;

  constructor() {
    this.testUtils = new TestUtils();
    this.until = protractor.ExpectedConditions;
  }

  get performTab() {
    return TestUtils.getElementByDataTestId('perform-tab');
  }

  get exportRibbon(): ElementFinder {
    return TestUtils.getElementByDataTestId('export-ribbon');
  }

  get includeModel(): ElementFinder {
    return TestUtils.getElementByDataTestId('tab-export-include-model');
  }

  get includeDataset(): ElementFinder {
    return TestUtils.getElementByDataTestId('tab-export-include-dataset');
  }

  get includeAccuracyConfiguration(): ElementFinder {
    return TestUtils.getElementByDataTestId('tab-export-include-accuracy-config');
  }

  get includeCalibrationConfiguration(): ElementFinder {
    return TestUtils.getElementByDataTestId('tab-packaging-include-calibration-config');
  }

  get exportButton(): ElementFinder {
    return TestUtils.getElementByDataTestId('export-project');
  }

  async isParamClickable(parameterEl: ElementFinder): Promise<boolean> {
    const classes = await parameterEl.getAttribute('class');

    return classes.split(' ').indexOf('mat-radio-disabled') === -1;
  }

  async exportProject(exportConfig: ProjectExportConfig): Promise<boolean> {
    await this.performTab.click();

    await browser.wait(this.until.presenceOf(this.exportRibbon));
    // Open Export ribbon
    console.log('Opening Export Tab.');
    await this.testUtils.clickElement(this.exportRibbon);

    // Check that 'Export' button is disabled by default
    expect(await this.exportButton.getAttribute('disabled')).toEqual(
      'true',
      'Export button is available but it should not be.'
    );

    // Parameter checking & selecting
    if (exportConfig.includeAccuracyConfig) {
      expect(await this.isParamClickable(this.includeAccuracyConfiguration)).toBeTruthy(
        'Accuracy Configuration export is not available but should be.'
      );

      await this.testUtils.clickElement(this.includeAccuracyConfiguration);
      console.log('Accuracy Config is included.');
    } else {
      expect(await this.isParamClickable(this.includeAccuracyConfiguration)).toBeFalsy(
        'Accuracy Configuration export is available but should not be.'
      );
    }

    if (exportConfig.includeCalibrationConfig) {
      expect(await this.isParamClickable(this.includeCalibrationConfiguration)).toBeTruthy(
        'Calibration Configuration export is not available.'
      );

      await this.testUtils.clickElement(this.includeCalibrationConfiguration);
      console.log('Calibration Config is included.');
    } else {
      expect(await this.isParamClickable(this.includeCalibrationConfiguration)).toBeFalsy(
        'Calibration Configuration export is available but should not be.'
      );
    }

    if (exportConfig.includeModel) {
      expect(await this.isParamClickable(this.includeModel)).toBeTruthy('Model export is not available.');
      await this.testUtils.clickElement(this.includeModel);
      console.log('Model is included.');
    }

    if (exportConfig.includeDataset) {
      expect(await this.isParamClickable(this.includeDataset)).toBeTruthy('Dataset export is not available.');
      await this.testUtils.clickElement(this.includeDataset);
      console.log('Dataset is included.');
    }

    // Export
    expect(await this.exportButton.getAttribute('disabled')).toBeNull(
      'Export button is not available but it should be.'
    );
    await this.testUtils.clickElement(this.exportButton);
    await browser.sleep(1500);

    // Check that archive was downloaded
    expect(await this.testUtils.isFileDownloaded(exportConfig.archivePath)).toBeTruthy('File was not downloaded.');

    return true;
  }
}

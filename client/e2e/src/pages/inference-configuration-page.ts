import { browser, protractor } from 'protractor';

import { IInferenceConfiguration } from '@shared/models/compound-inference-config';

import { TestUtils } from './test-utils';
import { InferenceUtils } from './inference-utils';

export class InferenceConfigurationPage {
  private until = protractor.ExpectedConditions;

  private elements = {
    runInferenceButtonEl: TestUtils.getElementByDataTestId('run-group-inference-button'),
    getCellEl: (batch: number, stream: number) => TestUtils.getElementByDataTestId(`cell_${batch}:${stream}`),
    selectedInferencesTableEl: TestUtils.getElementByDataTestId('selected-inferences-table'),
    getSelectedInferenceTableRowEl: (batch: number, stream: number) =>
      TestUtils.getElementByDataTestId(`selected_inference_${batch}:${stream}`),
    reduceInferenceTimeEl: TestUtils.getElementByDataTestId('set-inference-time'),
    breadcrumbToProjectsByModel: TestUtils.getElementByDataTestId('breadcrumb-to-projects-by-model'),
  };

  async selectInferences(inferences: IInferenceConfiguration[]) {
    const elements = inferences.map(({ batch, nireq }) => this.elements.getCellEl(batch, nireq));

    await Promise.all(elements.map((el) => browser.wait(this.until.presenceOf(el))));

    return Promise.all(elements.map((el) => el.click()));
  }

  async runInferences(inferences: IInferenceConfiguration[], reduceinferenceTime = true) {
    await this.selectInferences(inferences);

    if (reduceinferenceTime) {
      await this.elements.reduceInferenceTimeEl.click();
    }

    await this.elements.runInferenceButtonEl.click();

    // smooth inference progress implemented with rxjs delay function
    // which completely blocks protractor execution
    // in order to solve it "await browser.waitForAngularEnabled(false);" used here
    // docs: https://www.protractortest.org/#/timeouts
    await browser.waitForAngularEnabled(false);
    await browser.waitForAngularEnabled(true);
  }

  isAllInferencesInSelectedTable(inferences: IInferenceConfiguration[]) {
    return Promise.all(
      inferences.map(({ batch, nireq }) => {
        return this.elements.getSelectedInferenceTableRowEl(batch, nireq).isPresent();
      })
    ).then((results) => results.every(Boolean));
  }

  async backToDashboard() {
    await this.elements.breadcrumbToProjectsByModel.click();
  }
}

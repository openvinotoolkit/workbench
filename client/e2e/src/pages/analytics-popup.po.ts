import { by, element } from 'protractor';

import { TestUtils } from './test-utils';

export class AnalyticsPopup {
  get refuseBtn() {
    return TestUtils.getElementByDataTestId('refuse-analytics');
  }

  get analyticsPopup() {
    return element(by.className('analytics-popup'));
  }

  public async refuseAnalyticsUsage() {
    const popUpAppeared = await this.analyticsPopup.isPresent();
    if (popUpAppeared) {
      console.log('Refuse analytics usage');
      await this.refuseBtn.click();
    }
  }
}

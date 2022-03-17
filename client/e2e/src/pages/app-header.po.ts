import { browser, by, element } from 'protractor';

import { TestUtils } from './test-utils';

export class AppHeaderPage {
  get logo() {
    return element(by.className('logo'));
  }

  get projectsTablePlaceholder() {
    return element(by.className('empty-msg'));
  }

  async navigateHome() {
    await this.logo.click();
  }

  getModelCardsCount() {
    const cards = TestUtils.getAllElementsByDataTestId('model-name');
    return cards.count();
  }
}

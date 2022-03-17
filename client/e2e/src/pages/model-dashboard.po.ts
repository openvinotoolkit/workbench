import { TestUtils } from './test-utils';

export class ModelDashboardPage {
  get newProjectBtn() {
    return TestUtils.getElementByDataTestId('new-project');
  }
}

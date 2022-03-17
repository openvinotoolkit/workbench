import { browser, protractor } from 'protractor';

import { AppPage } from './pages/home-page.po';
import { AppHeaderPage } from './pages/app-header.po';
import { Helpers } from './pages/helpers';
import { TestUtils } from './pages/test-utils';
import { LoginPage } from './pages/login.po';
import { AnalyticsPopup } from './pages/analytics-popup.po';

describe('UI tests on Home Page', () => {
  let page: AppPage;
  let header: AppHeaderPage;
  let analyticsPopup: AnalyticsPopup;
  let helpers;
  let until;

  beforeAll(async () => {
    page = new AppPage();
    header = new AppHeaderPage();
    helpers = new Helpers();
    analyticsPopup = new AnalyticsPopup();
    until = protractor.ExpectedConditions;
    await page.navigateTo();
    await browser.sleep(1000);
    await browser.refresh();
    await LoginPage.authWithTokenOnLoginPage();
    await analyticsPopup.refuseAnalyticsUsage();
  });

  beforeEach(async () => {
    await new TestUtils().testPreparation();
  });

  afterEach(() => {
    browser.sleep(1000);
  });

  it('should display page title', async () => {
    expect(await page.getPageTitle()).toEqual('DL Workbench');
  });

  it('should contain Create button', async () => {
    expect(page.createProjectButton.isPresent()).toBeTruthy();
  });

  it('should check content of home page', async () => {
    expect(await page.activeConfigurationsTitle.getText()).toEqual('Start Page');
    expect(await page.capabilitiesImage.isPresent()).toBeTruthy();
    expect(await page.capabilitiesImage.getAttribute('src')).toContain('wb-stages.svg');
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });
});

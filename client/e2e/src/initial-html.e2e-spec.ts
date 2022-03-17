import { browser, by, element, ElementFinder } from 'protractor';

import { TestUtils } from './pages/test-utils';
import { AppPage } from './pages/home-page.po';

describe('UI tests for initial HTML page', () => {
  let page: AppPage;
  let isDevCloud: boolean;

  beforeAll(async () => {
    isDevCloud = browser.params.launchEnvironment === 'devCloud';
    page = new AppPage();
    await page.navigateTo();
  });

  it('should include script for disabling analytics', async () => {
    const bodyElement = element(by.tagName('body'));
    const disableAnalyticsScript: ElementFinder = bodyElement.element(by.id('analytics-disable-script'));

    expect(await disableAnalyticsScript.isPresent()).toBeTruthy();
    const disableAnalyticsScriptType = await disableAnalyticsScript.getAttribute('type');
    expect(disableAnalyticsScriptType).toEqual('text/javascript');
    const disableAnalyticsScriptSrc = await disableAnalyticsScript.getAttribute('src');
    expect(disableAnalyticsScriptSrc).toContain('assets/js/analytics-disable.js');
  });

  it('should check base prefix', async () => {
    const headElement = element(by.tagName('head'));
    const baseElement: ElementFinder = headElement.element(by.tagName('base'));
    expect(await baseElement.isPresent()).toBeTruthy();
    const baseUrl = await baseElement.getAttribute('href');
    const { pathname } = new URL(baseUrl);
    const expectedBasePrefix = '/';
    expect(pathname).toEqual(expectedBasePrefix);
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });
});

import { browser, protractor } from 'protractor';

import { TestUtils } from './pages/test-utils';
import { Helpers } from './pages/helpers';
import { LoginPage } from './pages/login.po';

// TODO: 32321
xdescribe('UI tests on Authentication', () => {
  let helpers: Helpers;
  let until;
  let testUtils: TestUtils;
  let loginPage: LoginPage;

  beforeAll(async () => {
    testUtils = new TestUtils();
    helpers = new Helpers();
    loginPage = new LoginPage();
    until = protractor.ExpectedConditions;
  });

  beforeEach(async () => {
    // Making sure that every test is executed from 'unlogged' state
    if (await loginPage.isLogged()) {
      await console.log('User is logged in. Proceed to log out.');
      await loginPage.logout();
      await console.log('Logged out.');
    }
  });

  it('Should login and open Configuration Wizard without being prompted to login', async () => {
    await loginPage.login(browser.params.token);
    await loginPage.navigateTo('/projects/create');
    expect(await browser.getCurrentUrl()).toContain('/projects/create');
  });

  it('Should try accessing the protected pages and should be redirected to the login page each time', async () => {
    await loginPage.navigateTo('/projects/create');
    expect(await browser.getCurrentUrl()).toContain('/login');
    await loginPage.navigateTo('/model-manager/import');
    expect(await browser.getCurrentUrl()).toContain('/login');
  });

  it(
    'Should navigate to the protected page with token in URL, navigate to the other page, ' +
      'should not be prompted to login',
    async () => {
      await loginPage.navigateTo(`/projects/create?token=${browser.params.token}`);
      await loginPage.navigateTo('/model-manager/import');
      expect(await browser.getCurrentUrl()).toContain('/model-manager/import');
    }
  );

  it('Should try to navigate to the protected page with invalid token, should be prompted to login', async () => {
    const invalidToken = browser.params.token + 'invalid';
    await loginPage.navigateTo(`/projects/create?token=${invalidToken}`);
    expect(await browser.getCurrentUrl()).toContain('/login');
  });

  it('Should verify authentication after refresh', async () => {
    await loginPage.login(browser.params.token);
    await browser.sleep(1000);
    await loginPage.navigateTo('/model-manager/import');
    expect(await browser.getCurrentUrl()).toContain('/model-manager/import');
  });

  it('Should login, clear cookies, navigate to the protected page, then should be prompted to login', async () => {
    await loginPage.login(browser.params.token);
    await loginPage.navigateTo('/projects/create');
    await browser.driver.manage().deleteAllCookies();
    await browser.sleep(1000);
    await browser.refresh();
    await loginPage.navigateTo('/model-manager/import');
    expect(await browser.getCurrentUrl()).toContain('/login');
  });

  afterEach(async () => {
    await TestUtils.takeScreenshot();
    await TestUtils.getBrowserLogs();
  });

  afterAll(async () => {
    await TestUtils.getBrowserLogs();
  });
});

import { browser, by, element, protractor } from 'protractor';

import { TestUtils } from './test-utils';

export class LoginPage {
  until = protractor.ExpectedConditions;

  static async authWithTokenOnLoginPage(): Promise<void> {
    const currentUrl = await browser.getCurrentUrl();
    console.log(`Current url ${currentUrl}`);
    if (currentUrl.includes('login')) {
      await new LoginPage().login(browser.params.token);
      await browser.sleep(1000);
    }
  }

  get tokenField() {
    return element(by.id('tokenControl'));
  }

  get loginBtn() {
    return TestUtils.getElementByDataTestId('login-button');
  }

  get logoutButton() {
    return TestUtils.getElementByDataTestId('logout-button');
  }

  get userIcon() {
    return TestUtils.getElementByDataTestId('user-toggle');
  }

  async toggleSideBar() {
    await browser.wait(this.until.elementToBeClickable(this.userIcon), browser.params.defaultTimeout);
    await this.userIcon.click();
    await browser.sleep(1000);
  }

  async clickLogout() {
    console.log('Try logout');
    await browser.wait(async () => {
      try {
        const currentURL = await browser.getCurrentUrl();
        if (currentURL.includes('login')) {
          return true;
        }

        await this.logoutButton.click();
        await browser.sleep(1000);
        return false;
      } catch (err) {
        return false;
      }
    }, browser.params.defaultTimeout);
  }

  async login(password: string): Promise<void> {
    console.log('Attempt login');
    await browser.wait(async () => await this.tokenField.isPresent(), browser.params.defaultTimeout);
    await this.tokenField.sendKeys(password);
    await this.loginBtn.click();
    console.log('Clicked login button');
    await browser.sleep(1000);
  }

  async logout() {
    await this.toggleSideBar();
    await this.clickLogout();
    await browser.sleep(1000);
  }

  async isLogged() {
    await browser.get('/');
    await browser.sleep(1000);
    const currentURL = await browser.getCurrentUrl();

    return !currentURL.includes('login');
  }

  async navigateTo(url: string) {
    await browser.get(url);
    await browser.sleep(2000);
  }
}

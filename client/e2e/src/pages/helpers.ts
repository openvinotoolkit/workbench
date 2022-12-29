import { browser, by, element } from 'protractor';

const DOMParser = require('@xmldom/xmldom').DOMParser;
const fs = require('fs');
const crypto = require('crypto');

type JSONPrimitive = string | number | boolean | null;
type JSONValue = JSONObject | JSONArray | JSONPrimitive;
type JSONArray = Array<JSONValue>;
interface JSONObject {
  [member: string]: JSONValue;
}

export class Helpers {
  static async setDevCloudCookies(fileWithCookies: string): Promise<void> {
    if (!fileWithCookies) {
      return;
    }

    const cookies = JSON.parse(fs.readFileSync(fileWithCookies));
    await browser.waitForAngularEnabled(false);
    await browser.driver.get(browser.baseUrl);
    for (const cookie of Object.keys(cookies)) {
      await browser.manage().addCookie({ name: cookie, value: `"${cookies[cookie]}"` });
    }
    await browser.driver.get(browser.baseUrl);
    await browser.waitForAngularEnabled(true);
    await browser.refresh();
    await browser.sleep(3000);
    console.log('Cookies configured');
  }

  static getRandomInRange(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  async hasClass(el, cls) {
    const classes = await el.getAttribute('class');
    return classes.split(' ').indexOf(cls) !== -1;
  }

  async fillInputWithValue(el, value) {
    await el.sendKeys(value);
  }

  async getElementValue(el) {
    return el.getAttribute('value');
  }

  generateName() {
    let text = '';
    const possible_characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < 5; i++) {
      text += possible_characters.charAt(Math.floor(Math.random() * possible_characters.length));
    }

    return text;
  }

  async getBaseUrl() {
    return await element(by.css('wb-header')).element(by.css('.header')).getAttribute('data-test-url');
  }

  extractLayers(res, type) {
    let xmlString = JSON.parse(res.bodyString);
    switch (type) {
      case 'exec':
        xmlString = xmlString.execGraph.replace(/\t/g, '');
        break;
      case 'ir':
        xmlString = xmlString.xmlContent.replace(/\t/g, '');
        xmlString = xmlString.replace(/\n/g, '');
        break;
    }
    const xml = new DOMParser().parseFromString(xmlString, 'text/xml');
    const graphJson = this.xmlToJson(xml);
    return ((graphJson.net as JSONObject).layers as JSONObject).layer;
  }

  // https://gist.github.com/demircancelebi/f0a9c7e1f48be4ea91ca7ad81134459d
  xmlToJson(xml): JSONObject {
    let obj = {};
    if (xml.nodeType === 1) {
      if (xml.attributes.length > 0) {
        // obj['@attributes'] = {};
        for (let j = 0; j < xml.attributes.length; j += 1) {
          const attribute = xml.attributes.item(j);
          obj[attribute.nodeName] = attribute.nodeValue;
        }
      }
    } else if (xml.nodeType === 3) {
      obj = xml.nodeValue;
    }

    if (xml.hasChildNodes() && xml.childNodes.length === 1 && xml.childNodes[0].nodeType === 3) {
      obj = xml.childNodes[0].nodeValue;
    } else if (xml.hasChildNodes()) {
      for (let i = 0; i < xml.childNodes.length; i += 1) {
        const item = xml.childNodes.item(i);
        const nodeName = item.nodeName;
        if (typeof obj[nodeName] === 'undefined') {
          obj[nodeName] = this.xmlToJson(item);
        } else {
          if (typeof obj[nodeName].push === 'undefined') {
            const old = obj[nodeName];
            obj[nodeName] = [];
            obj[nodeName].push(old);
          }
          obj[nodeName].push(this.xmlToJson(item));
        }
      }
    }
    return obj;
  }

  hashSum(pathToFile): Promise<string> {
    return new Promise((resolve, reject) => {
      const sum = crypto.createHash('md5');
      try {
        const file = fs.ReadStream(pathToFile);
        file.on('data', function (data) {
          sum.update(data);
        });
        file.on('end', function () {
          const hash = sum.digest('hex');
          return resolve(hash);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  getFilesFromFolder(path: string, filter?: string[] | string): string[] {
    let result;
    if (filter) {
      result = fs.readdirSync(path).filter((el) => {
        if (Array.isArray(filter)) {
          return filter.includes(el.split('.').slice(-1)[0]);
        } else {
          return el.split('.').slice(-1)[0] === filter;
        }
      });
    } else {
      result = fs.readdirSync(path);
    }
    return result;
  }
}

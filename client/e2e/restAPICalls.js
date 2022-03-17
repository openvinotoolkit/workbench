const request = require('request');
const fs = require('fs-extra');

class RestAPICalls {
  constructor(url, username, token) {
    this.url = url;
    this.username = username;
    this.token = token;
    this.apiPrefix = 'api/v1';
  }

  async getLog(url, path, spec) {
    return new Promise(async (resolve, reject) => {
      if (!(await this.createLogDir(path))) {
        reject('Cant create directory');
      }
      const { statusCode, bodyString } = await this.getServerLog(url);
      if (statusCode === 200) {
        await this.writeLog(path, spec, bodyString);
        resolve('Done write log file');
      } else {
        console.log(`Status: ${statusCode}`);
        console.log(bodyString);
        reject('Cant get log from server');
      }
    });
  }

  async getServerLog(url) {
    const urlTest = `${url}/${this.apiPrefix}/test-log`;
    const options = {
      url: urlTest,
      body: '',
      method: 'POST',
      strictSSL: false,
    };
    return await this.sendRequest(options);
  }

  async getAccessToken() {
    const { token, username } = this;
    const options = {
      url: new URL(`${this.apiPrefix}/auth/login`, `${this.url}`).href,
      strictSSL: false,
      json: { token, username },
    };
    return new Promise((resolve, reject) => {
      request.post(options, (error, response, responseBody) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(responseBody.accessToken);
      });
    });
  }

  async getDataFromBackend(urlPath, params) {
    const urlTest = new URL(`${this.apiPrefix}/${urlPath}`, `${this.url}`).href;
    const options = {
      url: urlTest,
      strictSSL: false,
    };

    if (params) {
      options['qs'] = params;
    }

    return this.sendRequest(options);
  }

  getHashFromServer(id) {
    return new Promise(async (resolve, reject) => {
      const urlPath = `check-sum/${id}`;
      const data = await this.getDataFromBackend(urlPath);
      if (data.statusCode === 200) {
        const body = JSON.parse(data.bodyString);
        body.hash ? resolve(body.hash) : reject('NULL hash');
      } else {
        console.log(data);
        reject('Drop connection');
      }
    });
  }

  getPackHash(config) {
    return new Promise(async (resolve, reject) => {
      const url = `${this.url}/${this.apiPrefix}/check-sum/deployment`;
      const options = {
        url: url,
        json: config,
        method: 'POST',
        strictSSL: false,
      };
      const { statusCode, bodyString } = await this.sendRequest(options);
      if (statusCode == 200) {
        resolve(bodyString.hash);
      } else {
        reject(`${statusCode}:  ${bodyString}`);
      }
    });
  }

  sendRequest(options) {
    return new Promise(async (resolve, reject) => {
      const accessToken = await this.getAccessToken();
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      };
      request(options, (error, response, body) => {
        if (error) {
          console.error(error);
          reject(error);
        }
        resolve({
          statusCode: response.statusCode,
          bodyString: body,
        });
      });
    });
  }

  async createLogDir(path) {
    try {
      await fs.ensureDir(path);
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async writeLog(path, spec, text) {
    const filePath = `${path}/${spec}.txt`;
    try {
      await fs.outputFile(filePath, text);
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = RestAPICalls;

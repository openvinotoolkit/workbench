const openvino = require('./netron/openvino.js');
const metadata = JSON.stringify(require('../../../../../../../../assets/netron/openvino-metadata.json'));

class WorkbenchBrowserHost {
  require(id) {
    if (id === './openvino') {
      return new Promise((resolve, reject) => {
        window['__modules__'] = window['__modules__'] || {};
        window['__modules__']['openvino'] = openvino;
        resolve(openvino);
      });
    }
  }

  request(file, encoding, base) {
    return new Promise((resolve, reject) => {
      if (file !== 'openvino-metadata.json') {
        resolve(null);
        return;
      }
      resolve(metadata);
    });
  }

  initialize(view) {
    return new Promise((resolve, reject) => {
      this._zoom = 'drag';
      resolve(view);
    });
  }

  get window() {
    return window;
  }

  get document() {
    return window.document;
  }

  environment(name) {
    if (name === 'zoom') {
      return this._zoom;
    }
    return null;
  }

  export(file, blob) {
    const element = this.document.createElement('a');
    element.download = file;
    element.href = URL.createObjectURL(blob);
    this.document.body.appendChild(element);
    element.click();
    this.document.body.removeChild(element);
  }

  confirm(message, detail) {
    // required for interface compatibility - used to skip confirm dialog and continue to load large model
    return true;
  }

  event(category, action, label, value) {
    // leave empty for interface compatibility - not used in DL Workbench
  }

  screen(name) {
    // leave empty for interface compatibility - not used in DL Workbench
  }

  start() {}
}

module.exports.WorkbenchBrowserHost = WorkbenchBrowserHost;

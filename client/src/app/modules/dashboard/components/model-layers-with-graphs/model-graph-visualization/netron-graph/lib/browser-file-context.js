// implements analogous abstraction from netron mainline
class WorkbenchBrowserFileContext {
  constructor(host, file, blobs) {
    this._host = host;
    this._file = file;
    this._blobs = {};
    for (const blob of blobs) {
      this._blobs[blob.name] = blob;
    }
  }

  get identifier() {
    return this._file.name;
  }

  get stream() {
    return this._stream;
  }

  open() {
    return this.request(this._file.name, null).then((stream) => {
      this._stream = stream;
    });
  }

  request(file, encoding, base) {
    if (base !== undefined) {
      return this._host.request(file, encoding, base);
    }
    const blob = this._blobs[file];
    if (!blob) {
      return Promise.reject(new Error("File not found '" + file + "'."));
    }
    return new Promise((resolve, reject) => {
      var reader = new FileReader();
      reader.onload = (e) => {
        resolve(encoding ? e.target.result : new host.BrowserHost.BinaryStream(new Uint8Array(e.target.result)));
      };
      reader.onerror = (e) => {
        e = e || window.event;
        let message = '';
        const error = e.target.error;
        switch (e.target.error.code) {
          case error.NOT_FOUND_ERR:
            message = "File not found '" + file + "'.";
            break;
          case error.NOT_READABLE_ERR:
            message = "File not readable '" + file + "'.";
            break;
          case error.SECURITY_ERR:
            message = "File access denied '" + file + "'.";
            break;
          default:
            error.message ? error.message : "File read '" + error.code.toString() + "' error '" + file + "'.";
            break;
        }
        reject(new Error(message));
      };
      if (encoding === 'utf-8') {
        reader.readAsText(blob, encoding);
      } else {
        reader.readAsArrayBuffer(blob);
      }
    });
  }
}

module.exports.WorkbenchBrowserFileContext = WorkbenchBrowserFileContext;

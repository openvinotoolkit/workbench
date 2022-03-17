class WorkbenchBinaryStream {
  constructor(buffer) {
    this._buffer = buffer;
    this._length = buffer.length;
    this._position = 0;
  }

  get length() {
    return this._length;
  }

  seek(position) {
    this._position = position >= 0 ? position : this._length + position;
  }

  skip(offset) {
    this._position += offset;
  }

  peek(length) {
    if (this._position === 0 && length === undefined) {
      return this._buffer;
    }
    const position = this._position;
    this.skip(length !== undefined ? length : this._length - this._position);
    const end = this._position;
    this.seek(position);
    return this._buffer.subarray(position, end);
  }

  read(length) {
    if (this._position === 0 && length === undefined) {
      this._position = this._length;
      return this._buffer;
    }
    const position = this._position;
    this.skip(length !== undefined ? length : this._length - this._position);
    return this._buffer.subarray(position, this._position);
  }
}

module.exports.WorkbenchBinaryStream = WorkbenchBinaryStream;

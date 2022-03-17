const brotli = require('brotli');
const fs = require('fs');

const { walk } = require('./common');

const brotliSettings = {
  extension: 'brotli',
  skipLarger: true,
  mode: 0, // 0 = generic, 1 = text, 2 = font (WOFF2)
  quality: 10, // 0 - 11,
  lgwin: 12, // default
};

const sourcePath = './dist';
const extensions = ['.js', '.css', '.scss', '.woff2'];

const allAssets = walk(sourcePath, extensions);

allAssets.forEach((file) => {
  const result = brotli.compress(fs.readFileSync(file), brotliSettings);
  fs.writeFileSync(`${file}.br`, result);
  fs.unlinkSync(file);
});

const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const appSourcesPath = path.join(__dirname, '..', '..', 'src');
const netronSourcesPath = path.join(__dirname, 'netron', 'source');
const stubsFilesPath = path.join(__dirname, 'stubs-files');

const whereSourcesPath = path.join(
  appSourcesPath,
  'app/modules/dashboard/components/model-layers-with-graphs/model-graph-visualization/netron-graph/lib/netron'
);
const whereAssetsPath = path.join(appSourcesPath, 'assets/netron');

console.group('Copying netron sources');

console.log('Removing and creating destination paths');
[whereSourcesPath, whereAssetsPath].forEach((path) => {
  rimraf.sync(path);
  fs.mkdirSync(path);
});

const coreScripts = ['view.js', 'view-grapher.js', 'view-sidebar.js', 'base.js', 'openvino.js'];

const assetsFiles = ['view-grapher.css', 'view-sidebar.css', 'openvino-metadata.json'];

const stubsFiles = [
  'gzip.js',
  'zip.js',
  'tar.js',
  'archive.js',
  'json.js',
  'flatbuffers.js',
  'protobuf.js',
  'python.js',
];

const getCopyFileCallback = (sourceDirectoryPath, destDirectoryPath) => (fileName) => {
  const sourceFilePath = path.join(sourceDirectoryPath, fileName);
  const destFilePath = path.join(destDirectoryPath, fileName);
  fs.copyFileSync(sourceFilePath, destFilePath);
};

// Copy core netron scripts
console.log('Copying core netron scripts');
coreScripts.forEach(getCopyFileCallback(netronSourcesPath, whereSourcesPath));

// Copy netron assets
console.log('Copying netron assets');
assetsFiles.forEach(getCopyFileCallback(netronSourcesPath, whereAssetsPath));

// Copy netron stubs files
console.log('Copying stubs files');
stubsFiles.forEach(getCopyFileCallback(stubsFilesPath, whereSourcesPath));

console.groupEnd();
console.log('Netron sources have been copied successfully');

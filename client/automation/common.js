const fs = require('fs');

function walk(dir, extensions, isRecursive) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      /* Recurse into a subdirectory */
      if (isRecursive) {
        results = results.concat(walk(file, extensions, isRecursive));
      }
    } else {
      /* Is a file */
      const matches = extensions.map((el) => file.endsWith(el));
      const isMatch = matches.filter((match) => !!match).length > 0;
      if (isMatch) {
        results.push(file);
      }
    }
  });
  return results;
}

module.exports = { walk };

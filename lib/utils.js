const fs = require('fs');
const util = require('util');
const { URL } = require('url');


function wait(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

function getFileNameFromPath(path) {
  const fileName = path.replace(/^.*[\\/]/, '');
  return fileName;
}

// Decides whether host has a protocol prefix and adds/omits '/' characters. Returns a valid URL.
function normalizeUrl(host, path) {
  if (host.substr(0, 4) !== 'http') host = `http://${host}`;

  const url = new URL(host);
  if (path) url.pathname = path;

  return url.href;
}

function readFile(path) {
  return util.promisify(fs.readFile)(path);
}

// Removes keys with undefined value from object
function compactObj(obj) {
  return Object.keys(obj).reduce((memo, key) => {
    const value = obj[key];
    return value === undefined ? memo : { ...memo, [key]: value };
  }, {});
}

module.exports = {
  wait,
  getFileNameFromPath,
  normalizeUrl,
  readFile,
  compactObj,
};

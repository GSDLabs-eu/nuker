const URI = require('urijs');
const fs = require('fs');
const util = require('util');


function wait(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

function getFileNameFromPath(path) {
  const fileName = path.replace(/^.*[\\/]/, '');
  return fileName;
}

// Decides whether host has a protocol prefix and adds/omits '/' characters. Returns a valid URL.
function normalizeUrl(host, path) {
  const isValidProtocol = ['http', 'https'].includes(new URI(host).protocol());
  let uri = isValidProtocol ? new URI(host) : new URI().protocol('http').host(host);

  if (path) {
    uri = uri.path(path);
  }

  return uri.toString();
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

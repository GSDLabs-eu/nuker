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
  return isValidProtocol ?
    new URI(host).path(path)
      .toString() :
    new URI().protocol('http').host(host).path(path)
      .toString();
}

function readFile(path) {
  return util.promisify(fs.readFile)(path);
}

module.exports = {
  wait,
  getFileNameFromPath,
  normalizeUrl,
  readFile,
};

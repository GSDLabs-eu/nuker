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

// Parses an array of 'file=example.jpg' format arguments and returns an array of objects [{ key: file, value: example.jpg }]
function parsePayload(array) {
  const parsedArray = array.map((payload) => {
    const [key, value] = payload.split('=');
    return { key, value };
  });
  return parsedArray;
}

// Decides whether host has a protocol prefix and adds/omits '/' characters. Returns a valid URL.
function normalizeUrl(host, path) {
  const isValidProtocol = ['http', 'https'].includes(new URI(host).protocol());
  return isValidProtocol ?
    new URI(host).path(path).toString() :
    new URI().protocol('http').host(host).path(path)
      .toString();
}

async function readFile(path) {
  fs.readFileAsync = util.promisify(fs.readFile);
  const data = await fs.readFileAsync(path);
  return JSON.parse(data);
}

module.exports = {
  wait,
  getFileNameFromPath,
  parsePayload,
  normalizeUrl,
  readFile,
};

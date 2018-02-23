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

// Parses an array of "file=example.jpg" format arguments and returns an array of objects [{ key: "file", value: "example.jpg" }]
function parseArgument(array = []) {
  const parsedArray = array.map((payload) => {
    const [key, value] = payload.split('=');
    return { key, value };
  });
  return parsedArray;
}

// Parses a JSON object { "file": "examples/example.jpg" } in config and returns [{ "key":"file", "value":"example.jpg" }]
function parseConfigObject(configObject = {}) {
  return Object.keys(configObject)
    .map(key => ({ key, value: configObject[key] }));
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
  parseArgument,
  normalizeUrl,
  readFile,
  parseConfigObject,
};

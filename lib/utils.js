const URI = require('urijs');

function wait(timeout) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

function getFileNameFromPath(path) {
  const fileName = path.replace(/^.*[\\/]/, '');
  return fileName;
}

// Parses an array of 'file=example.jpg' format arguments and returns an array of objects [{ key: file, value: example.jpg }]
function parsePayload(array) {
  const payloadArray = [];
  array.forEach((i) => {
    const [key, value] = i.split('=');
    const payloadObject = { key, value };
    payloadArray.push(payloadObject);
  });
  return payloadArray;
}

// Decides whether host has a protocol prefix and adds/omits '/' characters. Returns a valid URL.
function normalizeUrl(host, path) {
  const isValidProtocol = ['http', 'https'].includes(new URI(host).protocol());
  return isValidProtocol ?
    new URI(host).path(path).toString() :
    new URI().protocol('http').host(host).path(path)
      .toString();
}

module.exports = {
  wait,
  getFileNameFromPath,
  parsePayload,
  normalizeUrl,
};

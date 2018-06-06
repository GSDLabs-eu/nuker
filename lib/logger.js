const fs = require('fs');

let errorLogWriteStream;

function init({ errorLogPath }) {
  errorLogWriteStream = fs.createWriteStream(errorLogPath);
}

function teardown() {
  errorLogWriteStream.end();
}

function log(string) {
  console.log(string);
}

function error(string) {
  errorLogWriteStream.write(string);
  errorLogWriteStream.write('\n');
}

module.exports = {
  init,
  teardown,
  log,
  error,
};

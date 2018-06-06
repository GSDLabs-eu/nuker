const fs = require('fs');

let errorLogWriteStream;

function init({ errorLogPath }) {

  return new Promise((resolve, reject) => {
    fs.exists(errorLogPath, (exists) => {
      if (!exists) {
        errorLogWriteStream = fs.createWriteStream(errorLogPath);
        return resolve();
      }

      fs.unlink(errorLogPath, (err) => {
        if (err) return reject(err);

        errorLogWriteStream = fs.createWriteStream(errorLogPath);
        return resolve();
      });
    });
  });
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

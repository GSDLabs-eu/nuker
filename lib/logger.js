const config = {};

function initLogger(verbose) {
  config.verbose = verbose;
}

function log(string) {
  console.log(string);
}

function logError(string) {
  console.error(string);
}

function logVerbose(string) {
  if (config.verbose) console.log(string);
}

module.exports = {
  log,
  logVerbose,
  logError,
  initLogger,
};

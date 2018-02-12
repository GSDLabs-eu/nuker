const config = {};

function initLogger(verbose) {
  config.verbose = verbose;
}

function log(string) {
  console.log(string);
}

function debug(string) {
  if (config.verbose) console.log(string);
}

module.exports = {
  log,
  debug,
  initLogger,
};

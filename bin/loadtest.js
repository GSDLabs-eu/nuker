#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const cliProgress = require('cli-progress');

const loadTest = require('../index');
const { exportResults } = require('../lib/exportResults');
const { normalizeUrl, readFile } = require('../lib/utils');
const logger = require('../lib/logger');
const events = require('../lib/events');

const DEFAULT_REQUEST_COUNT = 10;
const DEFAULT_TEST_DURATION = 10;
const DEFAULT_OUTPUT_PATH = './results.html';
const DEFAULT_REQUEST_METHOD = 'GET';
const DEFAULT_TIMEOUT = 120000;
const ERROR_LOG_PATH = './error.log';

const argumentDefinitions = [
  { name: 'host', alias: 'h', type: String },
  { name: 'path', alias: 'p', type: String },
  {
    name: 'query',
    alias: 'q',
    type: String,
    multiple: true,
  },
  { name: 'method', alias: 'm', type: String },
  {
    name: 'formField',
    alias: 'f',
    type: String,
    multiple: true,
  },
  {
    name: 'formFile',
    alias: 'F',
    type: String,
    multiple: true,
  },
  { name: 'body', alias: 'b', type: String },
  { name: 'bodyPath', alias: 'B', type: String },
  { name: 'count', alias: 'c', type: Number },
  { name: 'duration', alias: 't', type: Number },
  { name: 'config', type: String },
  { name: 'outpath', type: String },
  { name: 'header', type: String, multiple: true },
  { name: 'timeout', type: Number },
];

async function argsFromFile(args) {
  let configFile = {};
  try {
    configFile = JSON.parse(await readFile(args.config));
  } catch (error) {
    logger.log('Could not read config file.');
    process.exit(1);
  }

  if (!configFile.host) {
    logger.log('You must specify a hostname.');
    process.exit(1);
  }

  if (configFile.body && configFile.bodyPath) {
    logger.log('body and bodyPath can\'t be present simultaneously');
    process.exit(1);
  }

  const config = {
    outputPath: configFile.outputPath || DEFAULT_OUTPUT_PATH,
    tests: [],
  };
  config.tests = configFile.tests.map(test => ({
    apiUrl: normalizeUrl(configFile.host, test.path),
    query: test.query,
    formFields: test.formFields,
    formFiles: test.formFiles,
    bodyString: test.bodyString,
    bodyPath: test.bodyPath,
    headers: test.headers,
    requestMethod: test.requestMethod || DEFAULT_REQUEST_METHOD,
    requestCount: test.requestCount || DEFAULT_REQUEST_COUNT,
    testDurationSeconds: test.testDurationSeconds || DEFAULT_TEST_DURATION,
    timeout: test.timeout || DEFAULT_TIMEOUT,
  }));
  return config;
}

function argsFromCommandLine(args) {
  if (!args.host) {
    logger.log('You must specify a hostname.');
    process.exit(1);
  }

  if (args.body && args.bodyPath) {
    logger.log('body and bodyPath can\'t be present simultaneously');
    process.exit(1);
  }

  // Parses an array of "file=example.jpg" format arguments and returns an object { file: example.jpg }
  function parseArgument(array = []) {
    const object = array.reduce((finalObject, next) => {
      const [key, value] = next.split('=');
      return {
        ...finalObject,
        [key]: value,
      };
    }, {});
    return object;
  }

  const config = {
    outputPath: args.outpath || DEFAULT_OUTPUT_PATH,
    tests: [{
      apiUrl: normalizeUrl(args.host, args.path),
      query: parseArgument(args.query),
      formFields: parseArgument(args.formField),
      formFiles: parseArgument(args.formFile),
      bodyString: args.bodyString,
      bodyPath: args.bodyPath,
      headers: parseArgument(args.header),
      requestMethod: args.method || DEFAULT_REQUEST_METHOD,
      requestCount: args.count || DEFAULT_REQUEST_COUNT,
      testDurationSeconds: args.duration || DEFAULT_TEST_DURATION,
      timeout: args.timeout || DEFAULT_TIMEOUT,
    }],
  };
  return config;
}

function initProgressBar() {
  const progressBar = new cliProgress.Bar({
    format: '{title} [{bar}] {percentage}% | ETA: {eta}s | {value}/{total} | Errors: {errorCount}',
  }, cliProgress.Presets.shades_classic);

  events.on('started', (test) => {
    progressBar.start(test.requestCount, 0, {
      errorCount: 0,
      title: test.apiUrl,
    });
  });
  events.on('progress', (response) => {
    const { errorCount } = progressBar.payload;
    progressBar.increment(1, { errorCount: response.success ? errorCount : errorCount + 1 });
  });
  events.on('completed', () => {
    progressBar.stop();
  });
}

async function runTests(args) {
  // Init

  logger.init({ errorLogPath: ERROR_LOG_PATH });

  initProgressBar();

  events.on('requestFailed', (seq, config, err) => {
    logger.error(`Request ${seq} to ${config.apiUrl} failed: ${err.message}`);
  });

  // Run tests

  logger.log('Running tests.');

  const config = args.config ? await argsFromFile(args) : argsFromCommandLine(args);
  const output = [];
  for (const test of config.tests) {
    output.push(await loadTest(test));
  }

  // Export results

  logger.log('Exporting results.');
  exportResults(output, config.outputPath);

  // Teardown

  logger.log(`Results saved to "${config.outputPath}"`);
  logger.log(`Error log saved to "${ERROR_LOG_PATH}"`);
  logger.log('Done.');
  logger.teardown();
}

runTests(commandLineArgs(argumentDefinitions));

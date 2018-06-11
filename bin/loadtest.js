#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const cliProgress = require('cli-progress');

const loadTest = require('../index');
const exportResults = require('../lib/exportResults');
const { normalizeUrl, readFile, compactObj } = require('../lib/utils');
const logger = require('../lib/logger');
const events = require('../lib/events');

const DEFAULT_REQUEST_COUNT = 10;
const DEFAULT_TEST_DURATION = 10;
const DEFAULT_OUTPUT_PATH = './results.html';
const DEFAULT_REQUEST_METHOD = 'GET';
const DEFAULT_TIMEOUT = 120000;
const ERROR_LOG_PATH = './error.log';

const argumentDefinitions = [
  { name: 'host', alias: 'H', type: String },
  { name: 'count', alias: 'C', type: Number },
  { name: 'time', alias: 'T', type: Number },
  { name: 'method', alias: 'm', type: String },
  { name: 'path', alias: 'p', type: String },
  { name: 'query', alias: 'q', type: String, multiple: true },
  { name: 'header', alias: 'h', type: String, multiple: true },
  { name: 'formField', alias: 'f', type: String, multiple: true },
  { name: 'formFile', alias: 'F', type: String, multiple: true },
  { name: 'body', alias: 'b', type: String },
  { name: 'bodyPath', alias: 'B', type: String },
  { name: 'timeout', alias: 't', type: Number },
  { name: 'outputPath', alias: 'o', type: String },
  { name: 'config', alias: 'c', type: String },
];

function parseMultiArgument(arg = []) {
  let parsed;

  if (arg || arg.length) {
    parsed = arg.reduce((memo, next) => {
      const [key, value] = next.split('=');
      return {
        ...memo,
        [key]: value,
      };
    }, {});
  }
  return parsed;
}

async function parseArguments(args) {
  let parsedArgs;

  if (args.config) {
    try {
      parsedArgs = JSON.parse(await readFile(args.config));
    } catch (error) {
      logger.log('Could not read config file.');
      process.exit(1);
    }
  } else {
    parsedArgs = {
      host: args.host,
      outputPath: args.outputPath,
      tests: [{
        requestCount: args.count,
        testDurationSeconds: args.time,
        requestMethod: args.method,
        path: args.path,
        query: parseMultiArgument(args.query),
        headers: parseMultiArgument(args.header),
        formFields: parseMultiArgument(args.formField),
        formFiles: parseMultiArgument(args.formFile),
        body: args.body,
        bodyPath: args.bodyPath,
        timeout: args.timeout,
      }],
    };
  }

  if (!parsedArgs.host) {
    logger.log('Hostname must be defined.');
    process.exit(1);
  }

  const config = {
    outputPath: parsedArgs.outputPath || DEFAULT_OUTPUT_PATH,
  };

  config.tests = parsedArgs.tests.map(test => compactObj({
    apiUrl: normalizeUrl(parsedArgs.host, test.path),
    requestCount: test.requestCount || DEFAULT_REQUEST_COUNT,
    testDurationSeconds: test.testDurationSeconds || DEFAULT_TEST_DURATION,
    requestMethod: test.requestMethod || DEFAULT_REQUEST_METHOD,
    query: test.query,
    headers: test.headers,
    formFields: test.formFields,
    formFiles: test.formFiles,
    body: test.body,
    bodyPath: test.bodyPath,
    timeout: test.timeout || DEFAULT_TIMEOUT,
  }));

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

async function runTests(config) {
  // Init

  await logger.init({ errorLogPath: ERROR_LOG_PATH });

  initProgressBar();

  events.on('requestFailed', (seq, test, err) => {
    logger.error(`Request ${seq} to ${test.apiUrl} failed: ${err.message}`);
  });

  // Run tests

  logger.log('Running tests.');

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

(async () =>
  runTests(await parseArguments(commandLineArgs(argumentDefinitions)))
)();

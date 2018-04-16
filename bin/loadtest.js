#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const { runTest } = require('../index');
const { exportResults } = require('../lib/exportResults');
const {
  normalizeUrl,
  readFile,
} = require('../lib/utils');
const { logError, initLogger } = require('../lib/logger');

const DEFAULT_REQUEST_COUNT = 10;
const DEFAULT_TEST_DURATION = 10;
const DEFAULT_OUTPUT_PATH = './results.html';
const DEFAULT_REQUEST_METHOD = 'GET';

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
  { name: 'verbose', type: Boolean },
  { name: 'config', type: String },
  { name: 'outpath', type: String },
  { name: 'header', type: String, multiple: true },
];
const args = commandLineArgs(argumentDefinitions);
initLogger(args.verbose);

async function argsFromFile() {
  let configFile = {};
  try {
    configFile = JSON.parse(await readFile(args.config));
  } catch (error) {
    logError('Could not read config file.');
    process.exit(1);
  }

  if (!configFile.host) {
    logError('You must specify a hostname.');
    process.exit(1);
  }

  if (configFile.body && configFile.bodyPath) {
    logError('body and bodyPath can\'t be present simultaneously');
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
  }));
  return config;
}

function argsFromCommandLine() {
  if (!args.host) {
    logError('You must specify a hostname.');
    process.exit(1);
  }

  if (args.body && args.bodyPath) {
    logError('body and bodyPath can\'t be present simultaneously');
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
    }],
  };
  return config;
}

async function loadTest() {
  const config = args.config ? await argsFromFile() : argsFromCommandLine();
  const responseData = [];
  for (const test of config.tests) {
    responseData.push(await runTest(test));
  }
  exportResults(responseData, config.outputPath);
}

loadTest();

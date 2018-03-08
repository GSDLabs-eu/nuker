#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const { runTest } = require('../index');
const { exportResults } = require('../lib/exportResults');
const {
  normalizeUrl,
  readFile,
} = require('../lib/utils');
const { log, initLogger } = require('../lib/logger');

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
  { name: 'bodyString', alias: 'b', type: String },
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
    log('Could not read config file.');
    process.exit(1);
  }

  const config = {
    bodyString: configFile.body,
    bodyPath: configFile.bodyPath,
    requestMethod: configFile.requestMethod || DEFAULT_REQUEST_METHOD,
    requestCount: configFile.requestCount || DEFAULT_REQUEST_COUNT,
    testDurationSeconds: configFile.testDurationSeconds || DEFAULT_TEST_DURATION,
    outputPath: configFile.outputPath || DEFAULT_OUTPUT_PATH,
  };
  config.apiUrl = normalizeUrl(configFile.host, configFile.path || '');
  config.query = configFile.queries;
  config.formFields = configFile.formFields;
  config.formFiles = configFile.formFiles;
  config.headers = configFile.headers;

  return config;
}

function argsFromCommandLine() {
  if (!args.host) {
    log('You must specity a hostname.');
    process.exit(1);
  }

  // Parses an array of "file=example.jpg" format arguments and returns an object { key: "file", value: "example.jpg" }
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
    bodyString: args.bodyString,
    bodyPath: args.bodyPath,
    requestMethod: args.method || DEFAULT_REQUEST_METHOD,
    requestCount: args.count || DEFAULT_REQUEST_COUNT,
    testDurationSeconds: args.duration || DEFAULT_TEST_DURATION,
    outputPath: args.outpath || DEFAULT_OUTPUT_PATH,
  };
  config.apiUrl = normalizeUrl(args.host, args.path || '');
  config.query = parseArgument(args.query);
  config.formFields = parseArgument(args.formField);
  config.formFiles = parseArgument(args.formFile);
  config.headers = parseArgument(args.header);

  return config;
}

async function loadTest() {
  const config = args.config ? await argsFromFile() : argsFromCommandLine();
  const responseData = await runTest(config);
  exportResults(responseData, config.outputPath);
}

loadTest();

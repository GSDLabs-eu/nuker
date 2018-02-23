#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const { runTest } = require('../index');
const { exportResults } = require('../lib/exportResults');
const {
  parseArgument,
  parseConfigObject,
  normalizeUrl,
  readFile,
} = require('../lib/utils');
const { log, initLogger } = require('../lib/logger');

const DEFAULT_REQUEST_COUNT = 10;
const DEFAULT_TEST_DURATION = 10;
const DEFAULT_OUTPUT_PATH = './results.html';

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
  { name: 'bodyText', alias: 'b', type: String },
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
  const apiUrl = normalizeUrl(configFile.host, configFile.path || '');
  const queries = parseConfigObject(configFile.queries);
  const formFields = parseConfigObject(configFile.formFields);
  const formFiles = parseConfigObject(configFile.formFiles);
  const headers = parseConfigObject(configFile.headers);

  return {
    apiUrl,
    queries,
    formFields,
    formFiles,
    body: configFile.body || '',
    bodyPath: configFile.bodyPath || '',
    headers,
    requestMethod: configFile.method || 'GET',
    requestCount: configFile.requestCount || DEFAULT_REQUEST_COUNT,
    testDurationSeconds: configFile.testDurationSeconds || DEFAULT_TEST_DURATION,
    outputPath: configFile.outputPath || DEFAULT_OUTPUT_PATH,
  };
}

function argsFromCommandLine() {
  if (!args.host) {
    log('You must specity a hostname.');
    process.exit(1);
  }
  const apiUrl = normalizeUrl(args.host, args.path || '');
  const queries = parseArgument(args.query);
  const formFields = parseArgument(args.formField);
  const formFiles = parseArgument(args.formFile);
  const headers = parseArgument(args.header);

  return {
    apiUrl,
    queries,
    formFields,
    formFiles,
    bodyText: args.bodyText || '',
    bodyPath: args.bodyPath || '',
    headers,
    requestMethod: args.method || 'GET',
    requestCount: args.count || DEFAULT_REQUEST_COUNT,
    testDurationSeconds: args.duration || DEFAULT_TEST_DURATION,
    outputPath: args.outpath || DEFAULT_OUTPUT_PATH,
  };
}

async function loadTest() {
  const config = args.config ? await argsFromFile() : argsFromCommandLine();
  const responseData = await runTest(config);
  exportResults(responseData, config.outputPath);
}

loadTest();

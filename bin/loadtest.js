#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const { runTest } = require('../index');
const { exportResults } = require('../lib/exportResults');
const { parsePayload, normalizeUrl, readFile } = require('../lib/utils');
const { log, initLogger } = require('../lib/logger');

const DEFAULT_REQUEST_COUNT = 10;
const DEFAULT_TEST_DURATION = 10;
const DEFAULT_OUTPUT_PATH = './results.html';

const argumentDefinitions = [
  { name: 'host', alias: 'h', type: String },
  { name: 'path', alias: 'p', type: String },
  {
    name: 'file',
    alias: 'f',
    type: String,
    multiple: true,
  },
  {
    name: 'keyvalue',
    alias: 'k',
    type: String,
    multiple: true,
  },
  { name: 'count', alias: 'c', type: Number },
  { name: 'duration', alias: 't', type: Number },
  { name: 'verbose', type: Boolean },
  { name: 'config', type: String },
  { name: 'outpath', type: String },
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
  const payloadPaths = Object.keys(configFile.payloadPaths || {})
    .map(key => ({ key, value: configFile.payloadPaths[key] }));
  const keyValuePairs = Object.keys(configFile.keyValuePairs || {})
    .map(key => ({ key, value: configFile.keyValuePairs[key] }));
  if (payloadPaths.length === 0 && keyValuePairs.length === 0) {
    log('Config file must contain at least one file or key/value pair for the FormData');
    process.exit(1);
  }
  return {
    apiUrl,
    payloadPaths,
    keyValuePairs,
    requestMethod: 'POST',
    requestCount: configFile.requestCount || DEFAULT_REQUEST_COUNT,
    testDurationSeconds: configFile.testDurationSeconds || DEFAULT_TEST_DURATION,
    outputPath: configFile.outputPath || DEFAULT_OUTPUT_PATH,
  };
}

function argsFromCommandLine() {
  if (!args.host || (!args.file && !args.keyvalue)) {
    log('You must specity a hostname and at least one file or key/value pair.');
    process.exit(1);
  }

  const payloadPaths = parsePayload(args.file || []);
  const keyValuePairs = parsePayload(args.keyvalue || []);
  const apiUrl = normalizeUrl(args.host, args.path || '');

  return {
    apiUrl,
    payloadPaths,
    keyValuePairs,
    requestMethod: 'POST',
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

#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const fs = require('fs');
const _ = require('lodash');
const performTest = require('../lib/makeRequests');
const exportToFile = require('../lib/template');
const { parsePayload } = require('../lib/utils');
const { normalizeUrl } = require('../lib/utils');
const { log } = require('../lib/logger');

let config = {};

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
  { name: 'method', alias: 'm', type: String },
  { name: 'count', alias: 'c', type: Number },
  { name: 'duration', alias: 'd', type: Number },
  { name: 'verbose', type: Boolean },
  { name: 'config', type: String },
];
const args = commandLineArgs(argumentDefinitions);

function argsFromFile() {
  let configFile = {};
  try {
    configFile = JSON.parse(fs.readFileSync(args.config));
  } catch (error) {
    log('Could not find config.json file. Please make sure you got the path right!');
    process.exit(1);
  }
  const apiUrl = normalizeUrl(configFile.host, configFile.path);
  const payloadPaths = [];
  const keyValuePairs = [];
  if (configFile.payloadPaths) {
    _.mapKeys(configFile.payloadPaths, (value, key) => payloadPaths.push({ key, value }));
  } else if (configFile.keyValuePairs) {
    _.mapKeys(configFile.keyValuePairs, (value, key) => keyValuePairs.push({ key, value }));
  } else {
    log('Config file must contain at lest one file or key/value pair for the FormData');
    process.exit(1);
  }
  config = {
    apiUrl,
    payloadPaths,
    keyValuePairs,
    requestMethod: 'POST',
    requestCount: configFile.requestCount,
    testDurationSeconds: configFile.testDurationSeconds,
    verbose: args.verbose || false,
  };
  return config;
}

function argsFromCommandLine() {
  if (!args.host || !args.path || (!args.file && !args.keyvalue)) {
    log('You must specity a hostname, a path, and at least one file or key/value pair.');
    process.exit(1);
  }

  let payloadPaths = [];
  if (args.file) {
    payloadPaths = parsePayload(args.file);
  }

  let keyValuePairs = [];
  if (args.keyvalue) {
    keyValuePairs = parsePayload(args.keyvalue);
  }

  const apiUrl = normalizeUrl(args.host, args.path);

  config = {
    apiUrl,
    payloadPaths,
    keyValuePairs,
    requestMethod: 'POST',
    requestCount: args.count || 10,
    testDurationSeconds: args.duration || 10,
    verbose: args.verbose || false,
  };
  return config;
}

if (args.config) {
  argsFromFile();
} else {
  argsFromCommandLine();
}

async function loadTest() {
  const responseData = await performTest(config);
  exportToFile(responseData);
}

loadTest();

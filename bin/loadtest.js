#!/usr/bin/env node

const performTest = require('../lib/request');
const exportToFile = require('../lib/template');
const commandLineArgs = require('command-line-args');

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
];

const args = commandLineArgs(argumentDefinitions);

if (!args.host || !args.path || (!args.file && !args.keyvalue)) {
  return console.log('Hostname, path, and either file, or key-value pair properies are mandatory');
}

// Converts payload file paths from "file=image.jpg" to "[file, image]"" and adds them to the payloadPaths array
const payloadPaths = [];
if (args.file) {
  args.file.map((i) => {
    payloadPaths.push(i.split('='));
  });
}

// Converts key-value pairs from "key=value" to "[key: value]" and adds them to the keyValuePairs array
const keyValuePairs = [];
if (args.keyvalue) {
  args.keyvalue.map((i) => {
    keyValuePairs.push(i.split('='));
  });
}

const apiHost = `http://${args.host}`;
const apiPath = `/${args.path}`;
const apiUri = apiHost + apiPath;
// const payloadPath = args.file;
const requestMethod = args.method || 'POST';
const requestCount = parseInt(args.count, 10) || 10;
const testDurationSeconds = args.duration || 10;

async function loadTest() {
  const responseData = await performTest(
    apiUri,
    payloadPaths,
    keyValuePairs,
    requestMethod,
    requestCount,
    testDurationSeconds,
  );
  exportToFile(responseData);
}

loadTest();

module.exports = loadTest;

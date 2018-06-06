const { makeRequests } = require('./lib/makeRequests');
const { buildOutput } = require('./lib/buildOutput');
const { logVerbose } = require('./lib/logger');

async function runTest(test) {
  const output = buildOutput(await makeRequests(test));
  Object.assign(output, {
    apiUrl: test.apiUrl,
    requestCount: test.requestCount,
    testDurationSeconds: test.testDurationSeconds,
  });

  logVerbose(`Successful: ${output.successCount}`);
  logVerbose(`Failed: ${output.errorCount}`);
  return output;
}

module.exports = { runTest };

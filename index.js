const { makeRequests } = require('./lib/makeRequests');
const { log, logVerbose } = require('./lib/logger');

async function runTest(config) {
  const response = await makeRequests(config);
  const responseTimes = Object.values(response.successful);
  const failedCount = Object.keys(response.failed).length;

  if (responseTimes.length === 0) {
    log('All requests have failed');
    process.exit(1);
  }

  const responseData = {
    requestCount: config.requestCount,
    testDurationSeconds: config.testDurationSeconds,
    apiUrl: config.apiUrl,
    responseTimes,
    averageResponseTime: (responseTimes.reduce((a, b) => a + b) / responseTimes.length).toFixed(0),
    slowestResponse: Math.max(...responseTimes),
    fastestResponse: Math.min(...responseTimes),
    failedCount,
  };

  logVerbose(`Successful: ${responseData.responseTimes.length}`);
  logVerbose(`Failed: ${failedCount}`);
  return responseData;
}

module.exports = { runTest };

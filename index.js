const { makeRequests } = require('./lib/makeRequests');
const { log, debug } = require('./lib/logger');

async function runTest({
  apiUrl,
  payloadPaths,
  keyValuePairs,
  requestMethod,
  requestCount,
  testDurationSeconds,
}) {
  const response = await makeRequests(
    apiUrl,
    payloadPaths,
    keyValuePairs,
    requestMethod,
    requestCount,
    testDurationSeconds,
  );
  const responseTimes = Object.values(response.successful);
  if (responseTimes.length === 0) {
    log('Every request has been rejected or timed out.');
    process.exit(1);
  }
  const failed = Object.keys(response.failed);
  const responseData = {
    requestCount,
    testDurationSeconds,
    apiUrl,
    responseTimes,
    averageResponseTime: (responseTimes.reduce((a, b) => a + b) / responseTimes.length).toFixed(0),
    slowestResponse: Math.max(...responseTimes),
    fastestResponse: Math.min(...responseTimes),
    failed,
  };

  debug(`Successful: ${responseData.responseTimes.length}`);
  debug(`Failed: ${responseData.failed.length}`);
  return responseData;
}

module.exports = { runTest };

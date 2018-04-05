const { makeRequests } = require('./lib/makeRequests');
const { logVerbose } = require('./lib/logger');

async function runTest(test) {
  const response = await makeRequests(test);
  const responseTimes = Object.values(response.successful);
  const failedCount = Object.keys(response.failed).length;

  const hasResponseTimes = !!responseTimes.length;

  const responseData = {
    requestCount: test.requestCount,
    testDurationSeconds: test.testDurationSeconds,
    apiUrl: test.apiUrl,
    responseTimes,
    averageResponseTime: hasResponseTimes ?
      (responseTimes.reduce((a, b) => a + b) / responseTimes.length).toFixed(0) : 0,
    slowestResponse: hasResponseTimes ? Math.max(...responseTimes) : 0,
    fastestResponse: hasResponseTimes ? Math.min(...responseTimes) : 0,
    failedCount,
  };

  logVerbose(`Successful: ${responseData.responseTimes.length}`);
  logVerbose(`Failed: ${failedCount}`);
  return responseData;
}

module.exports = { runTest };

const { makeRequests } = require('./lib/makeRequests');
const { logVerbose } = require('./lib/logger');

function buildOutput(results) {
  const output = {
    timeline: {
      successfulResponseTimes: [],
      errorCounts: [],
    },
    successCount: 0,
    networkErrorCount: 0,
    httpErrorCount: 0,
  };

  let aggrResponseTime = 0;
  let aggrErrorResponseTime = 0;
  let aggrTotalResponseTime = 0;

  results.forEach((result) => {
    const { responseTime } = result;

    if (result.success) {
      output.successCount += 1;
      output.fastestResponseTime = Math.min(responseTime, output.fastestResponseTime || Infinity);
      output.slowestResponseTime = Math.max(responseTime, output.slowestResponseTime || 0);
      aggrResponseTime += responseTime;
    } else if (responseTime) { // A non-2xx http response
      output.httpErrorCount += 1;
      output.fastestErrorResponseTime = Math.min(responseTime, output.fastestErrorResponseTime || Infinity);
      output.slowestErrorResponseTime = Math.max(responseTime, output.slowestErrorResponseTime || 0);
      aggrErrorResponseTime += responseTime;
    } else { // no response received
      output.networkErrorCount += 1;
    }

    output.errorCount = output.httpErrorCount + output.networkErrorCount;
    aggrTotalResponseTime = aggrResponseTime + aggrErrorResponseTime;

    output.timeline.successfulResponseTimes.push(result.success ? responseTime : null);
    output.timeline.errorCounts.push(output.errorCount);
  });

  // Totals
  output.fastestTotalResponseTime =
    Math.min(output.fastestResponseTime || Infinity, output.fastestErrorResponseTime || Infinity);
  output.slowestTotalResponseTime =
    Math.max(output.slowestResponseTime || 0, output.slowestErrorResponseTime || 0);

  // Averages
  if (output.successCount) {
    output.averageResponseTime = Math.round(aggrResponseTime / output.successCount);
  }
  if (output.httpErrorCount) {
    output.averageErrorResponseTime = Math.round(aggrErrorResponseTime / output.httpErrorCount);
  }
  if (output.successCount || output.httpErrorCount) {
    output.averageTotalResponseTime = Math.round(aggrTotalResponseTime / (output.successCount + output.httpErrorCount));
  }

  return output;
}

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

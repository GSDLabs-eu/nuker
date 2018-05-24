const { makeRequests } = require('./lib/makeRequests');
const { logVerbose } = require('./lib/logger');

function buildOutput(results) {
  const output = {
    timeline: {
      responseTimes: [],
      errorCounts: [],
    },
    successCount: 0,
    errorCount: 0,
    fastestResponseTime: Number.POSITIVE_INFINITY,
    slowestResponseTime: 0,
    averageResponseTime: 0,
  };
  let totalResponseTime = 0;
  results.forEach((result) => {
    let { responseTime } = result;

    if (!result.success) {
      responseTime = null;
      output.errorCount += 1;
    }

    if (result.success) {
      output.successCount += 1;
      if (responseTime > output.slowestResponseTime) output.slowestResponseTime = responseTime;
      if (responseTime < output.fastestResponseTime) output.fastestResponseTime = responseTime;
      totalResponseTime += responseTime;
    }

    if (output.successCount === 0) {
      output.fastestResponseTime = 0;
    }

    output.timeline.responseTimes.push(responseTime);
    output.timeline.errorCounts.push(output.errorCount);
  });
  if (output.successCount !== 0) output.averageResponseTime = Math.round(totalResponseTime / output.successCount);
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

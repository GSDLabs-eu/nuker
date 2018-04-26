const { makeRequests } = require('./lib/makeRequests');
const { logVerbose } = require('./lib/logger');

function buildChartData(results) {
  const chartData = {
    responseTimeAxis: [],
    errorAxis: [],
    errorCount: 0,
  };

  results.forEach((result) => {
    let { responseTime } = result;

    if (!result.success) {
      responseTime = null;
      chartData.errorCount += 1;
    }

    chartData.responseTimeAxis.push(responseTime);
    chartData.errorAxis.push(chartData.errorCount);
  });
  return chartData;
}

async function runTest(test) {
  const response = await makeRequests(test);
  const chartData = buildChartData(response);
  const filteredResponseTimes = chartData.responseTimeAxis.filter(x => !!x);
  const hasResponseTimes = !!filteredResponseTimes.length;

  Object.assign(chartData, {
    requestCount: test.requestCount,
    testDurationSeconds: test.testDurationSeconds,
    apiUrl: test.apiUrl,
    averageResponseTime: hasResponseTimes ?
      (filteredResponseTimes.reduce((a, b) => a + b) / filteredResponseTimes.length).toFixed(0) : 0,
    slowestResponse: hasResponseTimes ? Math.max(...filteredResponseTimes) : 0,
    fastestResponse: hasResponseTimes ? Math.min(...filteredResponseTimes) : 0,
  });

  logVerbose(`Successful: ${filteredResponseTimes.length}`);
  logVerbose(`Failed: ${chartData.errorCount}`);
  return chartData;
}

module.exports = { runTest };

const rp = require('request-promise');
const fs = require('fs');
const mime = require('mime-types');
const { wait } = require('./utils');
const { getFileNameFromPath } = require('./utils');
const { log } = require('./logger');


async function networkRequest(apiUrl, requestMethod, payloadPaths, keyValuePairs, verbose) {
  const options = {
    method: requestMethod,
    uri: apiUrl,
    resolveWithFullResponse: true,
    simple: false,
    formData: {},
  };

  payloadPaths.forEach((payloadPath) => {
    const fileStream = fs.createReadStream(payloadPath.value);
    const filename = getFileNameFromPath(payloadPath.value);
    options.formData[payloadPath.key] = {
      value: fileStream,
      options: {
        filename,
        contentType: mime.lookup(filename),
      },
    };
  });

  keyValuePairs.forEach((keyValuePair) => {
    options.formData[keyValuePair.key] = keyValuePair.value;
  });

  if (verbose) log('networkRequest called');
  const requestSentDate = Date.now();
  try {
    await rp(options);
    const responseReceivedDate = Date.now();
    const responseTime = responseReceivedDate - requestSentDate;
    return {
      failed: false,
      responseTime,
    };
  } catch (err) {
    log('Request rejected or timed out');
    return {
      failed: true,
      err,
    };
  }
}

async function performRequests(
  apiUrl,
  payloadPaths,
  keyValuePairs,
  requestMethod,
  requestCount,
  testDurationSeconds,
  verbose,
) {
  log(`Performing network requests. This will take ${testDurationSeconds} seconds.`);
  if (verbose) log(`Endpoint is ${apiUrl}`);
  let completedCount = 0;
  const timeOffset = (testDurationSeconds / requestCount) * 1000;

  return new Promise((resolve) => {
    const allResults = {
      successful: {},
      failed: {},
    };

    // requests return a 'failed' boolean and either a response time or an error description, both referred to as 'value'
    function completed(id, response) {
      if (response.failed) allResults.failed[id] = response.value;
      else allResults.successful[id] = response.responseTime;
      completedCount += 1;
      if (requestCount === completedCount) resolve(allResults);
    }
    // TODO:
    // in edge cases, when the number of requests are low relative to the duration, the last request won't wait for it's timeout to finish. this reqults in lower durations.
    // e.g. 2 requests in 20 seconds result in a 10 second request duration. req1 fires immediately, req2 @ 10secs
    async function execute() {
      for (let id = 1; id <= requestCount; id += 1) {
        networkRequest(apiUrl, requestMethod, payloadPaths, keyValuePairs, verbose)
          .then(response => completed(id, response));
        await wait(timeOffset);
      }
    }
    execute();
  });
}

async function performTest({
  apiUrl,
  payloadPaths,
  keyValuePairs,
  requestMethod,
  requestCount,
  testDurationSeconds,
  verbose,
}) {
  const response = await performRequests(
    apiUrl,
    payloadPaths,
    keyValuePairs,
    requestMethod,
    requestCount,
    testDurationSeconds,
    verbose,
  );
  const responseTimes = Object.values(response.successful);
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
  if (verbose) {
    log(`Successful: ${responseData.responseTimes.length}`);
    log(`Failed: ${responseData.failed.length}`);
  }
  return responseData;
}

module.exports = performTest;

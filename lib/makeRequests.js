const rp = require('request-promise');
const fs = require('fs');
const mime = require('mime-types');
const { wait, getFileNameFromPath } = require('./utils');
const { log, debug } = require('./logger');

async function networkRequest(apiUrl, requestMethod, payloadPaths, keyValuePairs, seq, requestCount) {
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

  debug(`Sending request ${seq}/${requestCount} to endpoint ${apiUrl}`);
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
    debug(`Request ${seq} was rejected or timed out.`);
    return {
      failed: true,
      err,
    };
  }
}

async function makeRequests(
  apiUrl,
  payloadPaths,
  keyValuePairs,
  requestMethod,
  requestCount,
  testDurationSeconds,
) {
  log(`Performing network requests. This will take ${testDurationSeconds} seconds.`);
  log(`Endpoint is ${apiUrl}`);
  let completedCount = 0;
  // First request fired right away, so it's ignored when calculating time
  const timeOffset = (testDurationSeconds / (requestCount - 1)) * 1000;

  return new Promise((resolve) => {
    const allResults = {
      successful: {},
      failed: {},
    };

    // Requests return a 'failed' boolean and either a response time or an error description, both referred to as 'value'
    function completed(seq, response) {
      if (response.failed) allResults.failed[seq] = response;
      else allResults.successful[seq] = response.responseTime;
      completedCount += 1;
      if (requestCount === completedCount) resolve(allResults);
    }
    // Sends a network request right away, then the rest along the remaining time
    async function execute() {
      for (let seq = 1; seq <= requestCount; seq += 1) {
        if (seq > 1) await wait(timeOffset);
        networkRequest(apiUrl, requestMethod, payloadPaths, keyValuePairs, seq, requestCount)
          .then(response => completed(seq, response));
      }
    }
    execute();
  });
}

module.exports = { makeRequests };
